import { prisma } from '@/lib/prisma';
import { ownerRoute } from '@/lib/owner/http';
import { updateLink, updateLinkInput } from '@/lib/owner/store';

export const dynamic = 'force-dynamic';

/** PATCH /api/owner/links/:id: edit fields; `{"isActive": false}` deactivates. */
export const PATCH = ownerRoute<{ id: string }>(async ({ owner, params, body }) => ({
    link: await updateLink(prisma, owner.id, params.id, await body(updateLinkInput)),
}));
