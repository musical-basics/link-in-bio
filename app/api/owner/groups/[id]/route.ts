import { prisma } from '@/lib/prisma';
import { ownerRoute } from '@/lib/owner/http';
import { updateGroup, updateGroupInput } from '@/lib/owner/store';

export const dynamic = 'force-dynamic';

/** PATCH /api/owner/groups/:id: rename (its links follow), describe, or set order. */
export const PATCH = ownerRoute<{ id: string }>(async ({ owner, params, body }) => ({
    group: await updateGroup(prisma, owner.id, params.id, await body(updateGroupInput)),
}));
