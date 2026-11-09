import { prisma } from '@/lib/prisma';
import { ownerRoute } from '@/lib/owner/http';
import { getOwnerSnapshot } from '@/lib/owner/store';

export const dynamic = 'force-dynamic';

/** GET /api/owner: who you are, your profile text, groups and links (in order). */
export const GET = ownerRoute(
    async ({ owner }) => ({
        user: { username: owner.username, email: owner.email },
        ...(await getOwnerSnapshot(prisma, owner.id)),
    }),
    { mutates: false },
);
