import { prisma } from '@/lib/prisma';
import { parseBasicAuth } from '@/lib/owner/auth';
import { ownerRoute } from '@/lib/owner/http';
import { changePassword, changePasswordInput } from '@/lib/owner/password';

export const dynamic = 'force-dynamic';

/**
 * POST /api/owner/password {"password": "<new>"}: replaces the authenticated
 * account's password (12-200 characters, not the current one). Responds
 * {"ok": true}; the password is never logged or returned.
 */
export const POST = ownerRoute(
    async ({ owner, req, body }) => {
        const { password } = await body(changePasswordInput);
        // ownerRoute has already verified these credentials.
        const current = parseBasicAuth(req.headers.get('authorization'))?.password ?? '';
        await changePassword(prisma, owner.id, password, current);
        return { ok: true };
    },
    { mutates: false },
);
