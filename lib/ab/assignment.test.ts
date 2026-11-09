/**
 * Middleware A/B decisions (lib/ab/assignment.ts) for a closed and a running
 * test. Closed: nobody is assigned, old cookies are cleared, and only admin
 * viewers can preview a variant (for that request, with no cookie).
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { decideAb } from './assignment.ts';
import {
    abRegistry,
    activeVariants,
    isActiveVariantKey,
    isTestClosed,
    pickVariantKey,
    type AbRegistry,
} from './registry.ts';

const closed: AbRegistry = { ...abRegistry, closedOn: '2026-11-09' };
const running: AbRegistry = { ...abRegistry, closedOn: null };
const visitor = { forced: null, current: undefined, isAdminViewer: false };

describe('closed test: no assignment', () => {
    test('the live registry is closed (closed on 2026-11-09)', () => {
        assert.equal(abRegistry.closedOn, '2026-11-09');
        assert.equal(isTestClosed(), true);
    });

    test('a fresh visitor gets no variant and no cookie, every time', () => {
        for (let i = 0; i < 200; i++) {
            assert.deepEqual(decideAb(visitor, closed), { assign: null, clearCookie: false, previewKey: null });
        }
        assert.deepEqual(decideAb(visitor), { assign: null, clearCookie: false, previewKey: null }); // live registry
    });

    test('the pool is empty and nothing is assignable', () => {
        assert.deepEqual(activeVariants(closed), []);
        assert.equal(pickVariantKey(closed), null);
        for (const key of ['2b', '2c', '3b', '3c']) assert.equal(isActiveVariantKey(key, closed), false);
    });

    test('a returning visitor’s mb_ab cookie is cleared, not renewed', () => {
        for (const current of ['2b', '2c', '3b', '3c', '1a', 'zz']) {
            assert.deepEqual(decideAb({ ...visitor, current }, closed), { assign: null, clearCookie: true, previewKey: null });
        }
    });

    test('?ab= does nothing for a normal visitor', () => {
        assert.deepEqual(decideAb({ ...visitor, forced: '3b' }, closed), { assign: null, clearCookie: false, previewKey: null });
    });

    test('?ab= previews for an admin viewer, for that request only (no cookie)', () => {
        const d = decideAb({ forced: '3b', current: undefined, isAdminViewer: true }, closed);
        assert.deepEqual(d, { assign: null, clearCookie: false, previewKey: '3b' });
        // retired keys still preview; unknown keys don't
        assert.equal(decideAb({ forced: '1a', current: undefined, isAdminViewer: true }, closed).previewKey, '1a');
        assert.equal(decideAb({ forced: '9z', current: undefined, isAdminViewer: true }, closed).previewKey, null);
    });
});

describe('running test (unchanged behaviour)', () => {
    test('a fresh visitor is assigned an active variant', () => {
        const pool = new Set(activeVariants(running).map((v) => v.key));
        assert.deepEqual([...pool].sort(), ['2b', '2c', '3b', '3c']);
        for (let i = 0; i < 200; i++) {
            const d = decideAb(visitor, running);
            assert.ok(d.assign && pool.has(d.assign), `assigned ${d.assign}`);
            assert.equal(d.clearCookie, false);
        }
    });

    test('a valid sticky cookie is kept; a retired one is re-bucketed', () => {
        assert.equal(decideAb({ ...visitor, current: '2c' }, running).assign, null);
        const d = decideAb({ ...visitor, current: '1a' }, running);
        assert.ok(d.assign && d.assign !== '1a');
    });

    test('?ab= forces a known variant; admin viewers are never randomly assigned', () => {
        assert.equal(decideAb({ ...visitor, forced: '3b' }, running).assign, '3b');
        assert.equal(decideAb({ forced: null, current: undefined, isAdminViewer: true }, running).assign, null);
    });
});
