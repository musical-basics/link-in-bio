/**
 * Owner API against a real Postgres. Skipped unless TEST_DATABASE_URL points
 * at a THROWAWAY database with the migrations applied: it deletes rows.
 * Never point it at production.
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
import { changePassword } from './password.ts';

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
        test('thumbnail on create and update, cleared with null, summarized in the listing', async () => {
            const link = await createLink(db, ada.id, {
                title: 'Portfolio', url: 'https://p.test', group: 'Work', icon: 'Link', layout: 'classic', isActive: true,
                thumbnail: 'https://img.test/p.png',
            });
            assert.equal(link.thumbnail, 'https://img.test/p.png');
            const inline = 'data:image/png;base64,' + 'A'.repeat(4096);
            assert.equal((await updateLink(db, ada.id, link.id, { thumbnail: inline })).thumbnail, inline);
            const listed = (await getOwnerSnapshot(db, ada.id)).links.find((l) => l.id === link.id);
            assert.equal(listed?.thumbnail, 'data:image/png (3 KB)');
            assert.equal((await updateLink(db, ada.id, link.id, { thumbnail: null })).thumbnail, null);
            // another user's link still 404s with a thumbnail payload
            await assert.rejects(updateLink(db, ada.id, eveLink.id, { thumbnail: 'https://img.test/x.png' }), (e: unknown) => e instanceof OwnerError && e.status === 404);
        });
        test('deactivate and profile text', async () => {
            const [a] = (await getOwnerSnapshot(db, ada.id)).links;
            assert.equal((await updateLink(db, ada.id, a.id, { isActive: false })).isActive, false);
            const profile = await updateProfileText(db, ada.id, { bio: 'Pianist.' });
            assert.equal(profile.bio, 'Pianist.');
        });
    });

    describe('password change', () => {
        test('new password works, old one stops working, other users untouched', async () => {
            const eveHash = (await db.user.findUnique({ where: { id: eve.id } }))!.password;
            await changePassword(db, ada.id, 'a-brand-new-password', 'ada-password');
            assert.equal(await authenticateOwner(db, basic('ada@example.com', 'ada-password')), null);
            assert.equal((await authenticateOwner(db, basic('ada@example.com', 'a-brand-new-password')))?.id, ada.id);
            assert.equal((await db.user.findUnique({ where: { id: eve.id } }))!.password, eveHash);
            assert.match((await db.user.findUnique({ where: { id: ada.id } }))!.password!, /^\$2[aby]\$10\$/);
        });
        test('rejects too short, too long and unchanged, leaving the password as it was', async () => {
            const bad = (e: unknown) => e instanceof OwnerError && e.status === 400;
            await assert.rejects(changePassword(db, ada.id, 'short', 'ada-password'), bad);
            await assert.rejects(changePassword(db, ada.id, 'x'.repeat(201), 'ada-password'), bad);
            await assert.rejects(changePassword(db, ada.id, 'ada-password', 'ada-password'), bad);
            assert.equal((await authenticateOwner(db, basic('ada@example.com', 'ada-password')))?.id, ada.id);
        });
    });
});
