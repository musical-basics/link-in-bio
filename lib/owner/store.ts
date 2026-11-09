import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';

/**
 * Link, group and profile edits scoped to one owner. Shared by the admin's
 * server actions (app/actions/*) and the owner API (app/api/owner/*), so both
 * behave the same. Every query filters on the owner's userId; another user's
 * id is simply "not found".
 *
 * The Prisma client is passed in so tests can run against a local database.
 */

type Db = PrismaClient;

export class OwnerError extends Error {
    status: 400 | 404 | 409;
    constructor(status: 400 | 404 | 409, message: string) {
        super(message);
        this.status = status;
    }
}

// ---------- validation ----------

const text = (max: number) => z.string().trim().min(1).max(max);
const url = z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine((u) => /^(https?:\/\/|mailto:|tel:)/i.test(u), 'url must start with https://, http://, mailto: or tel:');
const order = z.number().int().min(-100000).max(100000);
const layout = z.enum(['classic', 'featured']);

/** The admin's rule: an inline data-URL thumbnail must be under 5MB. */
export const THUMBNAIL_TOO_LARGE = 'Thumbnail is too large. Please use an image under 5MB.';
export function isThumbnailTooLarge(thumbnail: unknown): boolean {
    if (typeof thumbnail !== 'string' || !thumbnail.startsWith('data:image')) return false;
    return (thumbnail.length * 0.75) / (1024 * 1024) > 5;
}
/** An https:// image URL or a data:image/… URL under 5MB; null clears it. */
const thumbnail = z
    .string()
    .trim()
    .refine((t) => /^https:\/\//i.test(t) || /^data:image\/[a-z0-9.+-]+[;,]/i.test(t), 'thumbnail must be an https:// URL or a data:image/… URL')
    .refine((t) => !isThumbnailTooLarge(t), THUMBNAIL_TOO_LARGE)
    .nullable();

export const createLinkInput = z
    .object({
        title: text(200),
        url,
        group: text(100),
        subtitle: z.string().trim().max(300).nullish(),
        icon: text(64).default('Link'),
        layout: layout.default('classic'),
        isActive: z.boolean().default(true),
        thumbnail: thumbnail.optional(),
        /** Explicit position; default: after every existing link. Nothing else moves. */
        order: order.optional(),
    })
    .strict();

export const updateLinkInput = z
    .object({
        title: text(200),
        url,
        group: text(100),
        subtitle: z.string().trim().max(300).nullable(),
        icon: text(64),
        layout,
        isActive: z.boolean(),
        thumbnail,
        order,
    })
    .partial()
    .strict()
    .refine((v) => Object.keys(v).length > 0, 'nothing to update');

export const createGroupInput = z
    .object({
        name: text(100),
        description: z.string().trim().max(300).nullish(),
        order: order.optional(),
    })
    .strict();

export const updateGroupInput = z
    .object({
        name: text(100),
        description: z.string().trim().max(300).nullable(),
        order,
    })
    .partial()
    .strict()
    .refine((v) => Object.keys(v).length > 0, 'nothing to update');

export const reorderInput = z.object({ ids: z.array(z.string().min(1)).min(1).max(1000) }).strict();

export const updateProfileTextInput = z
    .object({
        name: text(100),
        bio: z.string().trim().max(2000).nullable(),
        heroHeadline: z.string().trim().max(200),
        heroSubtitle: z.string().trim().max(500),
        showHero: z.boolean(),
    })
    .partial()
    .strict()
    .refine((v) => Object.keys(v).length > 0, 'nothing to update');

// ---------- shared with the admin's server actions ----------

/**
 * The admin's link-update rules (app/actions/links.ts updateLink): only
 * updatable fields pass, and an inline data-URL thumbnail must be under 5MB.
 */
export function pickLinkUpdate(data: Record<string, any>): { data: Record<string, unknown> } | { error: string } {
    const updateData: Record<string, unknown> = {};
    for (const key of ['title', 'subtitle', 'url', 'icon', 'group', 'order', 'isActive', 'layout'] as const) {
        if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (data.thumbnail !== undefined) {
        if (isThumbnailTooLarge(data.thumbnail)) return { error: THUMBNAIL_TOO_LARGE };
        updateData.thumbnail = data.thumbnail;
    }
    return { data: updateData };
}

/** Updates a link only if it belongs to userId; null when it doesn't (or doesn't exist). */
export async function updateOwnedLink(db: Db, userId: string, id: string, data: Record<string, any>) {
    const link = await db.link.findFirst({ where: { id, userId }, select: { id: true } });
    if (!link) return null;
    const picked = pickLinkUpdate(data);
    if ('error' in picked) throw new OwnerError(400, picked.error);
    return db.link.update({ where: { id }, data: picked.data });
}

async function nextOrder(db: Db, model: 'link' | 'group', userId: string): Promise<number> {
    const agg =
        model === 'link'
            ? await db.link.aggregate({ where: { userId }, _max: { order: true } })
            : await db.group.aggregate({ where: { userId }, _max: { order: true } });
    return (agg._max.order ?? 0) + 1;
}

// ---------- owner API ----------

export async function getOwnerSnapshot(db: Db, userId: string) {
    const [profile, groups, links] = await Promise.all([
        db.profile.findUnique({
            where: { userId },
            select: { name: true, bio: true, heroHeadline: true, heroSubtitle: true, showHero: true, theme: true },
        }),
        db.group.findMany({ where: { userId }, orderBy: { order: 'asc' }, select: { id: true, name: true, description: true, order: true } }),
        db.link.findMany({
            where: { userId },
            orderBy: { order: 'asc' },
            select: { id: true, title: true, subtitle: true, url: true, icon: true, group: true, layout: true, isActive: true, order: true, thumbnail: true },
        }),
    ]);
    return { profile, groups, links: links.map((l) => ({ ...l, thumbnail: summarizeThumbnail(l.thumbnail) })) };
}

/** URLs as-is; inline images as "data:image/png (120 KB)" so listings stay small. */
export function summarizeThumbnail(thumbnail: string | null): string | null {
    if (!thumbnail?.startsWith('data:')) return thumbnail;
    const type = /^data:([^;,]+)/.exec(thumbnail)?.[1] ?? 'unknown';
    return `data:${type} (${Math.round((thumbnail.length * 0.75) / 1024)} KB)`;
}

async function assertGroupExists(db: Db, userId: string, name: string) {
    const [group, linkInGroup] = await Promise.all([
        db.group.findFirst({ where: { userId, name }, select: { id: true } }),
        db.link.findFirst({ where: { userId, group: name }, select: { id: true } }),
    ]);
    if (group || linkInGroup) return;
    const names = (await db.group.findMany({ where: { userId }, orderBy: { order: 'asc' }, select: { name: true } })).map((g) => g.name);
    throw new OwnerError(400, `Unknown group "${name}". Existing groups: ${names.join(', ') || '(none)'}`);
}

export async function createLink(db: Db, userId: string, input: z.infer<typeof createLinkInput>) {
    await assertGroupExists(db, userId, input.group);
    return db.link.create({
        data: {
            userId,
            title: input.title,
            url: input.url,
            group: input.group,
            subtitle: input.subtitle || null,
            icon: input.icon,
            layout: input.layout,
            isActive: input.isActive,
            thumbnail: input.thumbnail ?? null,
            order: input.order ?? (await nextOrder(db, 'link', userId)),
        },
    });
}

export async function updateLink(db: Db, userId: string, id: string, input: z.infer<typeof updateLinkInput>) {
    if (input.group !== undefined) await assertGroupExists(db, userId, input.group);
    const link = await updateOwnedLink(db, userId, id, input);
    if (!link) throw new OwnerError(404, 'Link not found');
    return link;
}

/**
 * Sets order = position in `ids`. `ids` must list every one of the owner's
 * links (or groups) exactly once, so no two end up sharing a position.
 */
async function reorder(db: Db, model: 'link' | 'group', userId: string, ids: string[]) {
    const rows =
        model === 'link'
            ? await db.link.findMany({ where: { userId }, select: { id: true } })
            : await db.group.findMany({ where: { userId }, select: { id: true } });
    const own = new Set(rows.map((r) => r.id));
    const seen = new Set<string>();
    for (const id of ids) {
        if (!own.has(id)) throw new OwnerError(404, `${model} ${id} not found`);
        if (seen.has(id)) throw new OwnerError(400, `${model} ${id} listed twice`);
        seen.add(id);
    }
    const missing = [...own].filter((id) => !seen.has(id));
    if (missing.length) throw new OwnerError(400, `ids must list all ${own.size} of your ${model}s; missing: ${missing.join(', ')}`);

    await db.$transaction(
        ids.map((id, index) =>
            model === 'link'
                ? db.link.update({ where: { id }, data: { order: index } })
                : db.group.update({ where: { id }, data: { order: index + 1 } }),
        ),
    );
}

export const reorderLinks = (db: Db, userId: string, ids: string[]) => reorder(db, 'link', userId, ids);
export const reorderGroups = (db: Db, userId: string, ids: string[]) => reorder(db, 'group', userId, ids);

export async function createGroup(db: Db, userId: string, input: z.infer<typeof createGroupInput>) {
    const exists = await db.group.findFirst({ where: { userId, name: input.name }, select: { id: true } });
    if (exists) throw new OwnerError(409, `Group "${input.name}" already exists`);
    return db.group.create({
        data: {
            userId,
            name: input.name,
            description: input.description || null,
            order: input.order ?? (await nextOrder(db, 'group', userId)),
        },
    });
}

/** Renaming a group also moves its links, which reference the group by name. */
export async function updateGroup(db: Db, userId: string, id: string, input: z.infer<typeof updateGroupInput>) {
    const group = await db.group.findFirst({ where: { id, userId } });
    if (!group) throw new OwnerError(404, 'Group not found');
    const renaming = input.name !== undefined && input.name !== group.name;
    if (renaming) {
        const clash = await db.group.findFirst({ where: { userId, name: input.name }, select: { id: true } });
        if (clash) throw new OwnerError(409, `Group "${input.name}" already exists`);
    }
    return db.$transaction(async (tx) => {
        if (renaming) {
            await tx.link.updateMany({ where: { userId, group: group.name }, data: { group: input.name } });
        }
        return tx.group.update({ where: { id }, data: input });
    });
}

export async function updateProfileText(db: Db, userId: string, input: z.infer<typeof updateProfileTextInput>) {
    const profile = await db.profile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new OwnerError(404, 'Profile not found');
    return db.profile.update({
        where: { userId },
        data: input,
        select: { name: true, bio: true, heroHeadline: true, heroSubtitle: true, showHero: true },
    });
}
