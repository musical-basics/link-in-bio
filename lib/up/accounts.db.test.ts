/**
 * Runs the Ultimate Pianist sign-in against a real Postgres. Skipped unless
 * TEST_DATABASE_URL points at a THROWAWAY database with the migrations applied
 * (it deletes rows). Never point it at production.
 *
 *   TEST_DATABASE_URL=postgresql://... npm run test:db
 */
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import prismaPkg from '@prisma/client';
import { createUserFromUpProfile, redeemLinkToken, resolveUpSignIn } from './accounts.ts';
import { normalizeUpProfile } from './profile.ts';

const url = process.env.TEST_DATABASE_URL;
const SECRET = 'db-test-secret';

describe('Ultimate Pianist accounts (database)', { skip: !url && 'TEST_DATABASE_URL not set' }, () => {
    const db = new prismaPkg.PrismaClient({ datasources: { db: { url } } });

    const ada = normalizeUpProfile({
        sub: 'user_ada',
        email: 'Ada@Example.com',
        email_verified: true,
        name: 'Ada Lovelace',
        username: 'ada',
        picture: 'https://img.clerk.com/ada.png',
    });

    before(async () => {
        if (/supabase|pooler|amazonaws/.test(url ?? '')) throw new Error('Refusing to run against a hosted database');
    });
    beforeEach(async () => {
        await db.user.deleteMany({}); // cascades to profile, groups, accounts
    });
    after(async () => {
        await db.$disconnect();
    });

    test('first sign-in creates user, profile, groups and the link', async () => {
        const outcome = await resolveUpSignIn(db, ada, SECRET);
        assert.equal(outcome.kind, 'created');
        const user = await db.user.findFirstOrThrow({ include: { profile: true, groups: true, accounts: true } });
        assert.equal(user.username, 'ada');
        assert.equal(user.email, 'ada@example.com');
        assert.equal(user.password, null);
        assert.equal(user.profile?.name, 'Ada Lovelace');
        assert.equal(user.profile?.imageUrl, 'https://img.clerk.com/ada.png');
        assert.deepEqual(user.groups.map((g) => g.name).sort(), ['Music', 'Socials', 'Work']);
        assert.deepEqual(
            user.accounts.map((a) => [a.provider, a.providerAccountId]),
            [['ultimatepianist', 'user_ada']],
        );
    });

    test('second sign-in uses the link, creates nothing', async () => {
        const first = await resolveUpSignIn(db, ada, SECRET);
        const second = await resolveUpSignIn(db, { ...ada, email: 'changed@example.com' }, SECRET);
        assert.equal(second.kind, 'linked');
        assert.equal(second.kind === 'linked' && first.kind === 'created' && second.userId === first.userId, true);
        assert.equal(await db.user.count(), 1);
    });

    test('username taken: de-duplicates against the database', async () => {
        await db.user.create({ data: { email: 'a1@x.test', username: 'ada', password: 'x' } });
        await db.user.create({ data: { email: 'a2@x.test', username: 'adalovelace', password: 'x' } });
        await db.user.create({ data: { email: 'a3@x.test', username: 'ada2', password: 'x' } });
        const created = await createUserFromUpProfile(db, ada);
        assert.equal(created.username, 'ada3');
    });

    test('email already on Musical Bio: no takeover, link only with that password login', async () => {
        const existing = await db.user.create({ data: { email: 'ada@example.com', username: 'adaold', password: 'hash' } });
        const outcome = await resolveUpSignIn(db, ada, SECRET);
        assert.equal(outcome.kind, 'needs-password');
        assert.equal(await db.account.count(), 0);
        if (outcome.kind !== 'needs-password') return;

        // Someone else logging in with a different account cannot redeem it.
        await db.user.create({ data: { email: 'eve@example.com', username: 'eve', password: 'hash' } });
        assert.equal(await redeemLinkToken(db, outcome.linkToken, SECRET, 'eve@example.com'), false);
        assert.equal(await redeemLinkToken(db, outcome.linkToken, 'wrong-secret', 'ada@example.com'), false);
        assert.equal(await db.account.count(), 0);

        // The owner (case-insensitive email) redeems it; the next UP sign-in is linked.
        assert.equal(await redeemLinkToken(db, outcome.linkToken, SECRET, 'ADA@example.com'), true);
        const next = await resolveUpSignIn(db, ada, SECRET);
        // The existing account has no profile row, so there is no photo to backfill.
        assert.deepEqual(next, { kind: 'linked', userId: existing.id, photoBackfilled: false });
        assert.equal(await db.user.count(), 2);
    });

    test('a later sign-in fills an empty photo from Ultimate Pianist', async () => {
        // First sign-in arrived without a photo (as on 2026-11-09).
        const first = await resolveUpSignIn(db, { ...ada, imageUrl: null }, SECRET);
        assert.equal(first.kind, 'created');
        const userId = first.kind === 'created' ? first.userId : '';
        assert.equal((await db.profile.findUniqueOrThrow({ where: { userId } })).imageUrl, null);

        // Signing in again, now with a photo: same account, photo filled.
        const again = await resolveUpSignIn(db, ada, SECRET);
        assert.deepEqual(again, { kind: 'linked', userId, photoBackfilled: true });
        assert.equal((await db.profile.findUniqueOrThrow({ where: { userId } })).imageUrl, 'https://img.clerk.com/ada.png');
        assert.equal(await db.user.count(), 1);

        // An empty-string photo counts as empty too.
        await db.profile.update({ where: { userId }, data: { imageUrl: '' } });
        assert.deepEqual(await resolveUpSignIn(db, ada, SECRET), { kind: 'linked', userId, photoBackfilled: true });
    });

    test("a photo the person set is never overwritten", async () => {
        const first = await resolveUpSignIn(db, ada, SECRET);
        const userId = first.kind === 'created' ? first.userId : '';
        await db.profile.update({ where: { userId }, data: { imageUrl: 'https://cdn.musical.bio/own.jpg' } });

        const again = await resolveUpSignIn(db, { ...ada, imageUrl: 'https://img.clerk.com/new.png' }, SECRET);
        assert.deepEqual(again, { kind: 'linked', userId, photoBackfilled: false });
        assert.equal((await db.profile.findUniqueOrThrow({ where: { userId } })).imageUrl, 'https://cdn.musical.bio/own.jpg');

        // No photo from Ultimate Pianist: nothing changes either.
        assert.deepEqual(await resolveUpSignIn(db, { ...ada, imageUrl: null }, SECRET), { kind: 'linked', userId, photoBackfilled: false });
    });

    test('unverified or missing email cannot create an account', async () => {
        assert.deepEqual(await resolveUpSignIn(db, { ...ada, emailVerified: false }, SECRET), { kind: 'no-email' });
        assert.deepEqual(await resolveUpSignIn(db, { ...ada, email: null }, SECRET), { kind: 'no-email' });
        assert.equal(await db.user.count(), 0);
    });
});
