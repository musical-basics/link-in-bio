import { prisma } from '@/lib/prisma';
import { ownerRoute } from '@/lib/owner/http';
import { createGroup, createGroupInput } from '@/lib/owner/store';

export const dynamic = 'force-dynamic';

/** POST /api/owner/groups: add a group. Without `order` it goes last. */
export const POST = ownerRoute(async ({ owner, body }) => ({
    group: await createGroup(prisma, owner.id, await body(createGroupInput)),
}));
