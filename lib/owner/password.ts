import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { OwnerError } from './store.ts';

/**
 * Password change for the owner API (POST /api/owner/password). The caller has
 * already authenticated with the current password; this sets a new one for
 * that account only. Never logs, echoes or returns a password.
 */

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 200;
/** Same cost as signup (app/actions/auth.ts). */
export const BCRYPT_COST = 10;

export const changePasswordInput = z.object({ password: z.string() }).strict();

/** Why the new password can't be used, or null if it can. Messages never include the password. */
export function newPasswordProblem(next: string, current: string): string | null {
    if (next.length < PASSWORD_MIN) return `The new password must be at least ${PASSWORD_MIN} characters.`;
    if (next.length > PASSWORD_MAX) return `The new password must be at most ${PASSWORD_MAX} characters.`;
    if (next === current) return 'The new password must be different from the current one.';
    return null;
}

export async function changePassword(db: PrismaClient, ownerId: string, next: string, current: string): Promise<void> {
    const problem = newPasswordProblem(next, current);
    if (problem) throw new OwnerError(400, problem);
    const hash = await bcrypt.hash(next, BCRYPT_COST);
    await db.user.update({ where: { id: ownerId }, data: { password: hash }, select: { id: true } });
}
