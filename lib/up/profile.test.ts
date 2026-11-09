import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildNewUserData,
    DEFAULT_BIO,
    FALLBACK_USERNAME,
    normalizeUpProfile,
    pickAvailableUsername,
    slugifyUsername,
    usernameCandidates,
    USERNAME_MAX,
    type UpProfile,
} from './profile.ts';

// What Ultimate Pianist's Clerk sends for `openid profile email`.
const fakeClaims = {
    sub: 'user_2abcDEF',
    email: '  Ada.Lovelace@Example.com ',
    email_verified: true,
    name: 'Ada Lovelace',
    given_name: 'Ada',
    family_name: 'Lovelace',
    username: 'ada_plays',
    picture: 'https://img.clerk.com/ada.png',
};

function profile(overrides: Partial<UpProfile> = {}): UpProfile {
    return { ...normalizeUpProfile(fakeClaims), ...overrides };
}

test('normalizeUpProfile maps the OIDC claims', () => {
    assert.deepEqual(normalizeUpProfile(fakeClaims), {
        providerAccountId: 'user_2abcDEF',
        email: 'ada.lovelace@example.com',
        emailVerified: true,
        name: 'Ada Lovelace',
        username: 'ada_plays',
        imageUrl: 'https://img.clerk.com/ada.png',
    });
});

test('normalizeUpProfile tolerates missing and alternative claims', () => {
    const p = normalizeUpProfile({ sub: 'u1', given_name: 'Clara', family_name: 'Schumann', preferred_username: 'clara' });
    assert.equal(p.name, 'Clara Schumann');
    assert.equal(p.username, 'clara');
    assert.equal(p.email, null);
    assert.equal(p.emailVerified, null);
    assert.equal(p.imageUrl, null);
});

test('normalizeUpProfile drops non-https pictures and requires a subject', () => {
    assert.equal(normalizeUpProfile({ sub: 'u1', picture: 'javascript:alert(1)' }).imageUrl, null);
    assert.equal(normalizeUpProfile({ sub: 'u1', picture: 'http://x.test/a.png' }).imageUrl, null);
    assert.throws(() => normalizeUpProfile({ email: 'a@b.c' }));
});

test('slugifyUsername keeps the signup character set', () => {
    assert.equal(slugifyUsername('Lionel Yu'), 'lionelyu');
    assert.equal(slugifyUsername('Frédéric Chopin'), 'fredericchopin');
    assert.equal(slugifyUsername('__ada--plays!!__'), 'ada-plays');
    assert.equal(slugifyUsername('j.s.bach'), 'jsbach');
    assert.equal(slugifyUsername('李小龙'), '');
    assert.equal(slugifyUsername('x'.repeat(50)).length, USERNAME_MAX);
});

test('usernameCandidates: UP username, then name, then email; skips unusable ones', () => {
    assert.deepEqual(usernameCandidates(profile()), ['ada_plays', 'adalovelace']);
    // reserved and too-short names are skipped
    assert.deepEqual(usernameCandidates(profile({ username: 'admin', name: 'Al' })), ['adalovelace']);
    // nothing usable at all
    assert.deepEqual(
        usernameCandidates(profile({ username: null, name: '李小龙', email: 'u@x.test' })),
        [FALLBACK_USERNAME],
    );
});

test('pickAvailableUsername uses the first free candidate as-is', () => {
    assert.equal(pickAvailableUsername(['ada_plays', 'adalovelace'], new Set()), 'ada_plays');
    assert.equal(pickAvailableUsername(['ada_plays', 'adalovelace'], new Set(['ada_plays'])), 'adalovelace');
});

test('pickAvailableUsername de-duplicates with the lowest free number', () => {
    const taken = new Set(['ada_plays', 'adalovelace', 'ada_plays2', 'ada_plays3']);
    assert.equal(pickAvailableUsername(['ada_plays', 'adalovelace'], taken), 'ada_plays4');
    assert.equal(pickAvailableUsername(['pianist'], new Set(['pianist'])), 'pianist2');
});

test('pickAvailableUsername stays within the length limit', () => {
    const base = 'a'.repeat(USERNAME_MAX);
    const picked = pickAvailableUsername([base], new Set([base]));
    assert.equal(picked, 'a'.repeat(USERNAME_MAX - 1) + '2');
    assert.ok(picked.length <= USERNAME_MAX);
});

test('pickAvailableUsername falls back to a random suffix when 2..999 are taken', () => {
    const taken = new Set(['bach', ...Array.from({ length: 998 }, (_, i) => `bach${i + 2}`)]);
    const picked = pickAvailableUsername(['bach'], taken, () => 0.5);
    assert.match(picked, /^bach-[a-z0-9]+$/);
    assert.ok(!taken.has(picked));
});

test('buildNewUserData: passwordless user, profile from UP, default groups, account link', () => {
    const data = buildNewUserData(profile(), 'ada_plays');
    assert.deepEqual(data.user, { email: 'ada.lovelace@example.com', username: 'ada_plays', password: null });
    assert.deepEqual(data.profile, {
        name: 'Ada Lovelace',
        bio: DEFAULT_BIO,
        imageUrl: 'https://img.clerk.com/ada.png',
        storageUsed: 0,
    });
    assert.deepEqual(data.groups.map((g) => g.name), ['Music', 'Socials', 'Work']);
    assert.deepEqual(data.account, { provider: 'ultimatepianist', providerAccountId: 'user_2abcDEF' });
});

test('buildNewUserData falls back for the display name and refuses a missing email', () => {
    assert.equal(buildNewUserData(profile({ name: null }), 'x').profile.name, 'ada_plays');
    assert.equal(buildNewUserData(profile({ name: null, username: null }), 'pianist7').profile.name, 'pianist7');
    assert.throws(() => buildNewUserData(profile({ email: null }), 'x'));
});
