import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LINK_TOKEN_TTL_MS, signLinkToken, verifyLinkToken } from './link-token.ts';
import { getUpConfig, isFromUltimatePianist, UP_DEFAULT_ISSUER } from './config.ts';

const SECRET = 'test-secret';
const data = { userId: 'mb_1', provider: 'ultimatepianist', providerAccountId: 'user_2abc' };

test('link token round-trips', () => {
    const now = 1_000_000;
    const token = signLinkToken(data, SECRET, now);
    assert.deepEqual(verifyLinkToken(token, SECRET, now + 1000), { ...data, exp: now + LINK_TOKEN_TTL_MS });
});

test('link token rejects expiry, a wrong secret and tampering', () => {
    const now = 1_000_000;
    const token = signLinkToken(data, SECRET, now);
    assert.equal(verifyLinkToken(token, SECRET, now + LINK_TOKEN_TTL_MS), null);
    assert.equal(verifyLinkToken(token, 'other-secret', now), null);

    const [, sig] = token.split('.');
    const forgedBody = Buffer.from(JSON.stringify({ ...data, userId: 'mb_2', exp: now + 9e9 })).toString('base64url');
    assert.equal(verifyLinkToken(`${forgedBody}.${sig}`, SECRET, now), null);
    assert.equal(verifyLinkToken('garbage', SECRET, now), null);
    assert.equal(verifyLinkToken(`${token}.x`, SECRET, now), null);
    assert.equal(verifyLinkToken(token, '', now), null);
});

test('Ultimate Pianist config is off until id and secret are both set', () => {
    assert.equal(getUpConfig({}), null);
    assert.equal(getUpConfig({ AUTH_ULTIMATEPIANIST_ID: 'id' }), null);
    assert.equal(getUpConfig({ AUTH_ULTIMATEPIANIST_ID: ' ', AUTH_ULTIMATEPIANIST_SECRET: 's' }), null);
    assert.deepEqual(getUpConfig({ AUTH_ULTIMATEPIANIST_ID: 'id', AUTH_ULTIMATEPIANIST_SECRET: 's' }), {
        clientId: 'id',
        clientSecret: 's',
        issuer: UP_DEFAULT_ISSUER,
    });
    assert.equal(
        getUpConfig({
            AUTH_ULTIMATEPIANIST_ID: 'id',
            AUTH_ULTIMATEPIANIST_SECRET: 's',
            AUTH_ULTIMATEPIANIST_ISSUER: 'https://clerk.staging.test/',
        })?.issuer,
        'https://clerk.staging.test',
    );
});

test('arrivals from Ultimate Pianist: ?from= or referrer', () => {
    assert.equal(isFromUltimatePianist({ from: 'ultimatepianist' }), true);
    assert.equal(isFromUltimatePianist({ from: ['UltimatePianist'] }), true);
    assert.equal(isFromUltimatePianist({ referer: 'https://ultimatepianist.com/profile' }), true);
    assert.equal(isFromUltimatePianist({ referer: 'https://app.ultimatepianist.com/x' }), true);
    assert.equal(isFromUltimatePianist({ referer: 'https://notultimatepianist.com/' }), false);
    assert.equal(isFromUltimatePianist({ referer: 'https://ultimatepianist.com.evil.test/' }), false);
    assert.equal(isFromUltimatePianist({ referer: 'https://musical.bio/signup' }), false);
    assert.equal(isFromUltimatePianist({ from: 'instagram', referer: 'not a url' }), false);
    assert.equal(isFromUltimatePianist({}), false);
});
