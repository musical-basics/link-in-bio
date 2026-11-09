/**
 * The `/:username` → `/u/:username` rewrite in next.config.mjs, matched with
 * Next's own path matcher (same path-to-regexp options as the routes manifest).
 * Reserved first segments must be excluded as whole segments only, so a
 * username that merely starts with one ("ursula", "apiary", "administrator")
 * still gets its bio page.
 */
import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pathMatch from 'next/dist/shared/lib/router/utils/path-match.js';
import nextConfig from '../../next.config.mjs';

type Rule = { source: string; destination: string };
type Matcher = (pathname: string) => false | Record<string, string>;

const { getPathMatch } = pathMatch as unknown as {
    getPathMatch: (path: string, opts: object) => Matcher;
};

// Filled in before() (no top-level await: tsconfig targets ES6).
let rewrites: Rule[] = [];
let usernameRule!: Rule;
let match!: Matcher;

before(async () => {
    assert.ok(nextConfig.rewrites, 'next.config.mjs defines no rewrites()');
    rewrites = (await nextConfig.rewrites()) as Rule[];
    const rule = rewrites.find((r) => r.destination === '/u/:username');
    assert.ok(rule, 'no /:username → /u/:username rewrite in next.config.mjs');
    usernameRule = rule;
    match = getPathMatch(rule.source, { strict: true, removeUnnamedParams: true, sensitive: false });
});

describe('/:username rewrite', () => {
    const rewritten = [
        '/lionelyu',
        '/ursula',
        '/uma',
        '/apiary',
        '/administrator',
        '/loginov',
        '/signups',
        '/_nextgen',
        '/LionelYu',
    ];
    for (const path of rewritten) {
        test(`${path} → /u${path}`, () => {
            const params = match(path);
            assert.ok(params, `${path} should be rewritten`);
            assert.equal(params.username, path.slice(1));
        });
    }

    const reserved = [
        '/admin',
        '/admin/',
        '/admin/settings',
        '/login',
        '/signup',
        '/signup?from=ultimatepianist',
        '/api',
        '/api/auth/session',
        '/api/cron/report',
        '/_next/static/chunks/main.js',
        '/u',
        '/u/ursula',
        '/u/lionelyu/story',
        '/favicon.ico',
        '/favicon',
        '/favicon-32x32.png',
    ];
    for (const path of reserved) {
        test(`${path} is not rewritten`, () => {
            assert.equal(match(path.split('?')[0]), false);
        });
    }

    test('/ is rewritten to Lionel\'s page by an earlier rule', () => {
        const rootIdx = rewrites.findIndex((r) => r.source === '/');
        assert.ok(rootIdx !== -1 && rootIdx < rewrites.indexOf(usernameRule));
        assert.equal(rewrites[rootIdx].destination, '/u/lionelyu');
    });
});
