import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claimNames, gatherUpClaims, mergeClaims, needsUserinfo, userinfoUrl } from './userinfo.ts';

const ISSUER = 'https://clerk.ultimatepianist.com';
const full = { sub: 'user_1', name: 'Sputty Leo', preferred_username: 'djsputty', picture: 'https://img.clerk.com/p.png', email: 'a@x.test' };

test('needsUserinfo: only when the picture, a name or a username is missing', () => {
    assert.equal(needsUserinfo(full), false);
    assert.equal(needsUserinfo({ ...full, picture: undefined }), true);
    assert.equal(needsUserinfo({ ...full, picture: '' }), true);
    assert.equal(needsUserinfo({ ...full, name: undefined }), true);
    assert.equal(needsUserinfo({ ...full, name: undefined, given_name: 'Sputty' }), false);
    assert.equal(needsUserinfo({ ...full, preferred_username: undefined }), true);
    assert.equal(needsUserinfo({ ...full, preferred_username: undefined, username: 'djsputty' }), false);
});

test('mergeClaims: ID token wins, userinfo fills gaps, other subjects are ignored', () => {
    const id = { sub: 'user_1', name: 'From ID token', email: 'id@x.test', picture: '' };
    const ui = { sub: 'user_1', name: 'From userinfo', email: 'ui@x.test', picture: 'https://img.clerk.com/u.png', username: 'djsputty' };
    assert.deepEqual(mergeClaims(id, ui, 'user_1'), {
        sub: 'user_1',
        name: 'From ID token',
        email: 'id@x.test',
        picture: 'https://img.clerk.com/u.png',
        username: 'djsputty',
    });
    assert.equal(mergeClaims(id, { ...ui, sub: 'someone_else' }, 'user_1'), id);
    assert.equal(mergeClaims(id, null, 'user_1'), id);
});

test('claimNames lists names of present claims only, never values', () => {
    assert.deepEqual(claimNames({ b: 'x', a: 1, empty: '', nil: null }), ['a', 'b']);
    assert.deepEqual(claimNames(null), []);
});

function fakeFetch(response: { status: number; body?: unknown } | Error) {
    const calls: { url: string; auth: string | null }[] = [];
    const impl = (async (url: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(url), auth: new Headers(init?.headers).get('authorization') });
        if (response instanceof Error) throw response;
        return new Response(JSON.stringify(response.body ?? {}), { status: response.status });
    }) as typeof fetch;
    return { impl, calls };
}

test('gatherUpClaims: a complete ID token needs no userinfo call', async () => {
    const f = fakeFetch({ status: 200, body: {} });
    const { claims, log } = await gatherUpClaims({ idClaims: full, sub: 'user_1', accessToken: 'at', issuer: ISSUER, fetchImpl: f.impl });
    assert.equal(f.calls.length, 0);
    assert.equal(claims.picture, full.picture);
    assert.equal(log.userinfo, null);
});

test('gatherUpClaims: picture missing from the ID token comes from userinfo', async () => {
    const f = fakeFetch({ status: 200, body: { sub: 'user_1', picture: 'https://img.clerk.com/u.png', username: 'djsputty' } });
    const id = { sub: 'user_1', name: 'Sputty Leo', email: 'a@x.test' };
    const { claims, log } = await gatherUpClaims({ idClaims: id, sub: 'user_1', accessToken: 'at', issuer: ISSUER, fetchImpl: f.impl });
    assert.deepEqual(f.calls, [{ url: `${ISSUER}/oauth/userinfo`, auth: 'Bearer at' }]);
    assert.equal(claims.picture, 'https://img.clerk.com/u.png');
    assert.equal(claims.name, 'Sputty Leo');
    assert.deepEqual(log, { idToken: ['email', 'name', 'sub'], userinfo: ['picture', 'sub', 'username'] });
    // The log carries names, not values.
    assert.ok(!JSON.stringify(log).includes('img.clerk.com'));
});

test('gatherUpClaims: userinfo failures fall back to the ID token without throwing', async () => {
    const id = { sub: 'user_1', name: 'Sputty Leo' };
    for (const response of [{ status: 401 }, { status: 500 }, new Error('network down')]) {
        const f = fakeFetch(response);
        const { claims, log } = await gatherUpClaims({ idClaims: id, sub: 'user_1', accessToken: 'at', issuer: ISSUER, fetchImpl: f.impl });
        assert.equal(f.calls.length, 1);
        assert.deepEqual(claims, id);
        assert.equal(log.userinfo, null);
    }
});

test('gatherUpClaims: no access token, no call; another subject is ignored', async () => {
    const id = { sub: 'user_1', name: 'Sputty Leo' };
    const none = fakeFetch({ status: 200, body: { sub: 'user_1', picture: 'https://x.test/p.png' } });
    await gatherUpClaims({ idClaims: id, sub: 'user_1', accessToken: undefined, issuer: ISSUER, fetchImpl: none.impl });
    assert.equal(none.calls.length, 0);

    const other = fakeFetch({ status: 200, body: { sub: 'user_2', picture: 'https://x.test/p.png' } });
    const { claims } = await gatherUpClaims({ idClaims: id, sub: 'user_1', accessToken: 'at', issuer: ISSUER, fetchImpl: other.impl });
    assert.equal(claims.picture, undefined);
});

test('userinfoUrl', () => {
    assert.equal(userinfoUrl('https://clerk.ultimatepianist.com/'), 'https://clerk.ultimatepianist.com/oauth/userinfo');
});
