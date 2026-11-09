import { prisma } from '@/lib/prisma';
import { ownerRoute } from '@/lib/owner/http';
import { reorderGroups, reorderInput } from '@/lib/owner/store';

export const dynamic = 'force-dynamic';

/** PUT /api/owner/groups/order: `{"ids": [...]}` lists all your group ids in the new order. */
export const PUT = ownerRoute(async ({ owner, body }) => {
    await reorderGroups(prisma, owner.id, (await body(reorderInput)).ids);
    return { ok: true };
});
