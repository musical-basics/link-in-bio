import { prisma } from '@/lib/prisma';
import { ownerRoute } from '@/lib/owner/http';
import { reorderInput, reorderLinks } from '@/lib/owner/store';

export const dynamic = 'force-dynamic';

/** PUT /api/owner/links/order: `{"ids": [...]}` lists all your link ids in the new order. */
export const PUT = ownerRoute(async ({ owner, body }) => {
    await reorderLinks(prisma, owner.id, (await body(reorderInput)).ids);
    return { ok: true };
});
