import { prisma } from '@/lib/prisma';
import { ownerRoute } from '@/lib/owner/http';
import { updateProfileText, updateProfileTextInput } from '@/lib/owner/store';

export const dynamic = 'force-dynamic';

/** PATCH /api/owner/profile: name, bio, heroHeadline, heroSubtitle, showHero. */
export const PATCH = ownerRoute(async ({ owner, body }) => ({
    profile: await updateProfileText(prisma, owner.id, await body(updateProfileTextInput)),
}));
