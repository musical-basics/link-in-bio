/**
 * Owner API against a real Postgres. Skipped unless TEST_DATABASE_URL points
 * at a THROWAWAY database with the migrations applied: it deletes rows and
 * alters the schema. Never point it at production.
 */
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import prismaPkg from '@prisma/client';
import { authenticateOwner } from './auth.ts';
import {
    createGroup,
    createLink,
    getOwnerSnapshot,
    OwnerError,
    reorderGroups,
    reorderLinks,
    updateGroup,
    updateLink,
    updateProfileText,
} from './store.ts';
import {
    ACCOUNT_LINKS_CHECKSUM,
    ACCOUNT_LINKS_MIGRATION,
    applyAccountLinksMigration,
    inspectDatabase,
    OWNER_EMAIL,
    setOwnerPassword,
} from './one-time-setup.ts';

const url = process.env.TEST_DATABASE_URL;
const basic = (email: string, password: string) => 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64');

describe('owner API (database)', { skip: !url && 'TEST_DATABASE_URL not set' }, () => {
    const db = new prismaPkg.PrismaClient({ datasources: { db: { url } } });
    let ada: { id: string };
    let eve: { id: string };
    let eveLink: { id: string };

    before(() => {
        if (/supabase|pooler|amazonaws/.test(url ?? '')) throw new Error('Refusing to run against a hosted database');
    });
    beforeEach(async () => {
        await db.user.deleteMany({});
        const hash = await bcrypt.hash('ada-password', 4);
        ada = await db.user.create({
            data: {
                email: 'ada@example.com',
                username: 'ada',
                password: hash,
                profile: { create: { name: 'Ada' } },
                groups: { create: [{ name: 'Music', order: 1 }, { name: 'Work', order: 2 }] },
                links: {
                    create: [
                        { title: 'A', url: 'https://a.test', icon: 'Link', group: 'Music', order: 0 },
                        { title: 'B', url: 'https://b.test', icon: 'Link', group: 'Work', order: 1 },
                        { title: 'C', url: 'https://c.test', icon: 'Link', group: 'Work', order: 2 },
                    ],
                },
            },
        });
        eve = await db.user.create({
            data: {
                email: 'eve@example.com',
                username: 'eve',
                password: await bcrypt.hash('eve-password', 4),
                profile: { create: { name: 'Eve' } },
                groups: { create: [{ name: 'Work', order: 1 }] },
                links: { create: [{ title: 'E', url: 'https://e.test', icon: 'Link', group: 'Work', order: 0 }] },
            },
            include: { links: true },
        }).then((u) => {
            eveLink = u.links[0];
            return u;
        });
    });
    after(async () => {
        await db.$disconnect();
    });

    describe('auth', () => {
        test('right email (any case) and password', async () => {
            const owner = await authenticateOwner(db, basic('ADA@example.com', 'ada-password'));
            assert.deepEqual(owner, { id: ada.id, email: 'ada@example.com', username: 'ada' });
        });
        test('wrong password, unknown email, missing or malformed auth', async () => {
            assert.equal(await authenticateOwner(db, basic('ada@example.com', 'wrong')), null);
            assert.equal(await authenticateOwner(db, basic('nobody@example.com', 'ada-password')), null);
            assert.equal(await authenticateOwner(db, null), null);
            assert.equal(await authenticateOwner(db, 'Bearer ada-password'), null);
        });
        test('an account without a password (Ultimate Pianist sign-in) cannot use the API', async () => {
            await db.user.update({ where: { id: ada.id }, data: { password: null } });
            assert.equal(await authenticateOwner(db, basic('ada@example.com', '')), null);
            assert.equal(await authenticateOwner(db, basic('ada@example.com', 'ada-password')), null);
        });
    });

    describe("other users' rows", () => {
        test("updating another user's link is 404 and changes nothing", async () => {
            await assert.rejects(updateLink(db, ada.id, eveLink.id, { title: 'pwned' }), (e: unknown) => e instanceof OwnerError && e.status === 404);
            assert.equal((await db.link.findUniqueOrThrow({ where: { id: eveLink.id } })).title, 'E');
        });
        test("reordering with another user's link id is 404", async () => {
            const mine = (await getOwnerSnapshot(db, ada.id)).links.map((l) => l.id);
            await assert.rejects(reorderLinks(db, ada.id, [...mine, eveLink.id]), (e: unknown) => e instanceof OwnerError && e.status === 404);
        });
        test("another user's group is 404, and the snapshot only shows your own rows", async () => {
            const eveGroup = await db.group.findFirstOrThrow({ where: { userId: eve.id } });
            await assert.rejects(updateGroup(db, ada.id, eveGroup.id, { name: 'x' }), (e: unknown) => e instanceof OwnerError && e.status === 404);
            const snap = await getOwnerSnapshot(db, ada.id);
            assert.deepEqual(snap.links.map((l) => l.title), ['A', 'B', 'C']);
            assert.deepEqual(snap.groups.map((g) => g.name), ['Music', 'Work']);
        });
    });

    describe('ordering', () => {
        test('a new link goes last by default and nothing else moves', async () => {
            const before = await getOwnerSnapshot(db, ada.id);
            const link = await createLink(db, ada.id, {
                title: 'Portfolio', url: 'https://p.test', group: 'Work', icon: 'Link', layout: 'classic', isActive: true,
            });
            assert.equal(link.order, 3);
            const afterSnap = await getOwnerSnapshot(db, ada.id);
            assert.deepEqual(afterSnap.links.map((l) => [l.title, l.order]), [...before.links.map((l) => [l.title, l.order]), ['Portfolio', 3]]);
        });
        test('an explicit order is used as given, without shifting others', async () => {
            const link = await createLink(db, ada.id, {
                title: 'Top', url: 'https://t.test', group: 'Music', icon: 'Link', layout: 'classic', isActive: true, order: -1,
            });
            assert.equal(link.order, -1);
            const snap = await getOwnerSnapshot(db, ada.id);
            assert.deepEqual(snap.links.map((l) => [l.title, l.order]), [['Top', -1], ['A', 0], ['B', 1], ['C', 2]]);
        });
        test('unknown group is refused with the list of groups', async () => {
            await assert.rejects(
                createLink(db, ada.id, { title: 'x', url: 'https://x.test', group: 'Nope', icon: 'Link', layout: 'classic', isActive: true }),
                /Unknown group "Nope". Existing groups: Music, Work/,
            );
        });
        test('reorderLinks sets positions; partial or duplicate lists are refused', async () => {
            const ids = (await getOwnerSnapshot(db, ada.id)).links.map((l) => l.id);
            await reorderLinks(db, ada.id, [ids[2], ids[0], ids[1]]);
            assert.deepEqual((await getOwnerSnapshot(db, ada.id)).links.map((l) => l.title), ['C', 'A', 'B']);
            await assert.rejects(reorderLinks(db, ada.id, [ids[0], ids[1]]), /must list all 3/);
            await assert.rejects(reorderLinks(db, ada.id, [ids[0], ids[0], ids[1]]), /listed twice/);
        });
        test('groups: create goes last, reorder, rename moves its links', async () => {
            const press = await createGroup(db, ada.id, { name: 'Press' });
            assert.equal(press.order, 3);
            await assert.rejects(createGroup(db, ada.id, { name: 'Press' }), (e: unknown) => e instanceof OwnerError && e.status === 409);
            const groups = (await getOwnerSnapshot(db, ada.id)).groups;
            await reorderGroups(db, ada.id, [press.id, groups[0].id, groups[1].id]);
            assert.deepEqual((await getOwnerSnapshot(db, ada.id)).groups.map((g) => [g.name, g.order]), [['Press', 1], ['Music', 2], ['Work', 3]]);

            const work = groups.find((g) => g.name === 'Work')!;
            await updateGroup(db, ada.id, work.id, { name: 'Projects' });
            const snap = await getOwnerSnapshot(db, ada.id);
            assert.deepEqual(snap.links.filter((l) => l.group === 'Projects').map((l) => l.title), ['B', 'C']);
            // Eve's "Work" group and links are untouched
            assert.equal(await db.link.count({ where: { userId: eve.id, group: 'Work' } }), 1);
        });
        test('deactivate and profile text', async () => {
            const [a] = (await getOwnerSnapshot(db, ada.id)).links;
            assert.equal((await updateLink(db, ada.id, a.id, { isActive: false })).isActive, false);
            const profile = await updateProfileText(db, ada.id, { bio: 'Pianist.' });
            assert.equal(profile.bio, 'Pianist.');
        });
    });

    describe('one-time setup', () => {
        test('set-password: owner only, then login works with the new password', async () => {
            const owner = await db.user.create({ data: { email: 'YuLionel829@gmail.com', username: 'lionelyu', password: 'old' } });
            assert.deepEqual(await setOwnerPassword(db, 'ada@example.com', 'new-password'), { ok: false, error: 'Only the owner account can be changed here' });
            assert.deepEqual(await setOwnerPassword(db, OWNER_EMAIL, '123'), { ok: false, error: 'Password must be 6 to 200 characters' });
            assert.deepEqual(await setOwnerPassword(db, OWNER_EMAIL.toUpperCase(), 'new-password'), { ok: true });
            const stored = await db.user.findUniqueOrThrow({ where: { id: owner.id } });
            assert.ok(stored.password?.startsWith('$2b$10$'));
            assert.ok((await authenticateOwner(db, basic(OWNER_EMAIL, 'new-password')))?.id === owner.id);
            // Ada untouched
            assert.ok(await authenticateOwner(db, basic('ada@example.com', 'ada-password')));
        });

        test('apply-migration is idempotent and records the history like prisma migrate', async () => {
            // Put the database back to "before add_account_links".
            await db.user.deleteMany({});
            await db.$executeRawUnsafe(`DROP TABLE "Account"`);
            await db.$executeRawUnsafe(`ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL`);
            await db.$executeRawUnsafe(`DELETE FROM _prisma_migrations WHERE migration_name = '${ACCOUNT_LINKS_MIGRATION}'`);
            const pre = await inspectDatabase(db);
            assert.equal(pre.passwordNullable, false);
            assert.equal(pre.accountTable, false);
            assert.equal(pre.earlierRecorded, true);
            assert.equal(pre.accountLinksRecorded, false);

            const first = await applyAccountLinksMigration(db);
            assert.deepEqual(first.steps, [
                'User.password made nullable',
                'Account table created',
                'index Account_userId_idx created',
                'index Account_provider_providerAccountId_key created',
                'index Account_userId_provider_key created',
                'foreign key Account_userId_fkey added',
            ]);
            assert.equal(first.history, 'recorded in _prisma_migrations');
            assert.equal(first.after.accountLinksRecorded, true);
            const [row] = await db.$queryRawUnsafe<{ checksum: string; applied_steps_count: number }[]>(
                `SELECT checksum, applied_steps_count FROM _prisma_migrations WHERE migration_name = '${ACCOUNT_LINKS_MIGRATION}'`,
            );
            assert.deepEqual(row, { checksum: ACCOUNT_LINKS_CHECKSUM, applied_steps_count: 1 });

            const second = await applyAccountLinksMigration(db);
            assert.deepEqual(second.steps, ['nothing to apply']);
            assert.equal(second.history, 'already recorded');
        });

        test('apply-migration without a _prisma_migrations table applies the SQL and records nothing', async () => {
            await db.$executeRawUnsafe(`DROP TABLE "Account"`);
            await db.$executeRawUnsafe(`ALTER TABLE _prisma_migrations RENAME TO _prisma_migrations_hidden`);
            try {
                const result = await applyAccountLinksMigration(db);
                assert.ok(result.steps.includes('Account table created'));
                assert.equal(result.history, 'no _prisma_migrations table: SQL applied, nothing recorded');
                assert.equal(result.after.historyTable, false);
            } finally {
                await db.$executeRawUnsafe(`ALTER TABLE _prisma_migrations_hidden RENAME TO _prisma_migrations`);
            }
        });
    });
});
