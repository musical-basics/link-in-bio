import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseBasicAuth } from './auth.ts';
import {
    createLinkInput,
    pickLinkUpdate,
    reorderInput,
    summarizeThumbnail,
    updateLinkInput,
    updateProfileTextInput,
} from './store.ts';
import { ACCOUNT_LINKS_CHECKSUM, ACCOUNT_LINKS_MIGRATION } from './one-time-setup.ts';

const basic = (s: string) => 'Basic ' + Buffer.from(s).toString('base64');

test('parseBasicAuth', () => {
    assert.deepEqual(parseBasicAuth(basic('Ada@Example.com:p:w d')), { email: 'Ada@Example.com', password: 'p:w d' });
    assert.equal(parseBasicAuth(null), null);
    assert.equal(parseBasicAuth(''), null);
    assert.equal(parseBasicAuth('Bearer abc'), null);
    assert.equal(parseBasicAuth(basic('no-colon')), null);
    assert.equal(parseBasicAuth(basic(':password-only')), null);
    assert.equal(parseBasicAuth(basic('ada@example.com:')), null);
});

test('createLinkInput: defaults, strictness and safe urls', () => {
    const parsed = createLinkInput.parse({ title: ' Portfolio ', url: 'https://lionelyu.com', group: 'Work' });
    assert.deepEqual(parsed, {
        title: 'Portfolio',
        url: 'https://lionelyu.com',
        group: 'Work',
        icon: 'Link',
        layout: 'classic',
        isActive: true,
    });
    assert.equal(createLinkInput.safeParse({ title: 'x', url: 'javascript:alert(1)', group: 'Work' }).success, false);
    assert.equal(createLinkInput.safeParse({ title: 'x', url: 'https://a.test', group: 'Work', userId: 'other' }).success, false);
    assert.equal(createLinkInput.safeParse({ title: '', url: 'https://a.test', group: 'Work' }).success, false);
    assert.equal(createLinkInput.safeParse({ title: 'x', url: 'https://a.test', group: 'Work', order: 1.5 }).success, false);
});

test('update inputs reject empty and unknown fields', () => {
    assert.equal(updateLinkInput.safeParse({}).success, false);
    assert.equal(updateLinkInput.safeParse({ clicks: 1000 }).success, false);
    assert.deepEqual(updateLinkInput.parse({ isActive: false }), { isActive: false });
    assert.equal(updateProfileTextInput.safeParse({ theme: 'cinematic' }).success, false);
    assert.equal(reorderInput.safeParse({ ids: [] }).success, false);
});

test('pickLinkUpdate keeps the admin rules: whitelist and the 5MB thumbnail limit', () => {
    assert.deepEqual(pickLinkUpdate({ title: 't', id: 'x', userId: 'u', clicks: 5, createdAt: 'now' }), { data: { title: 't' } });
    const big = 'data:image/png;base64,' + 'A'.repeat(7 * 1024 * 1024);
    assert.ok('error' in pickLinkUpdate({ thumbnail: big }));
    assert.deepEqual(pickLinkUpdate({ thumbnail: null }), { data: { thumbnail: null } });
});

test('thumbnail: https URL or data:image under 5MB, null clears, nothing else', () => {
    const base = { title: 'x', url: 'https://a.test', group: 'Work' };
    assert.equal(createLinkInput.parse({ ...base, thumbnail: 'https://img.test/a.png' }).thumbnail, 'https://img.test/a.png');
    const small = 'data:image/png;base64,' + 'A'.repeat(1000);
    assert.equal(createLinkInput.parse({ ...base, thumbnail: small }).thumbnail, small);
    assert.equal(updateLinkInput.parse({ thumbnail: null }).thumbnail, null);

    const big = 'data:image/png;base64,' + 'A'.repeat(7 * 1024 * 1024);
    const tooBig = updateLinkInput.safeParse({ thumbnail: big });
    assert.equal(tooBig.success, false);
    assert.match(JSON.stringify(tooBig.error?.issues), /under 5MB/);
    for (const bad of ['http://img.test/a.png', 'javascript:alert(1)', 'data:text/html,<script>', 'img.png', '']) {
        assert.equal(createLinkInput.safeParse({ ...base, thumbnail: bad }).success, false, bad);
    }
    assert.equal(summarizeThumbnail(small), 'data:image/png (1 KB)');
    assert.equal(summarizeThumbnail('https://img.test/a.png'), 'https://img.test/a.png');
    assert.equal(summarizeThumbnail(null), null);
});

test('the recorded migration checksum matches the migration file', () => {
    const sql = readFileSync(new URL(`../../prisma/migrations/${ACCOUNT_LINKS_MIGRATION}/migration.sql`, import.meta.url));
    assert.equal(createHash('sha256').update(sql).digest('hex'), ACCOUNT_LINKS_CHECKSUM);
});
