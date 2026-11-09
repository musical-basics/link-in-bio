import { prisma } from '@/lib/prisma';
import { ownerRoute } from '@/lib/owner/http';
import { createLink, createLinkInput } from '@/lib/owner/store';

export const dynamic = 'force-dynamic';

/** POST /api/owner/links: add a link. Without `order` it goes after every existing link. */
export const POST = ownerRoute(async ({ owner, body }) => ({
    link: await createLink(prisma, owner.id, await body(createLinkInput)),
}));
