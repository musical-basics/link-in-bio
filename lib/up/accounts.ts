import type { PrismaClient } from '@prisma/client';
import { UP_PROVIDER_ID } from './config.ts';
import { signLinkToken, verifyLinkToken } from './link-token.ts';
import { buildNewUserData, pickAvailableUsername, usernameCandidates, type UpProfile } from './profile.ts';

/**
 * The database side of "Sign in with Ultimate Pianist". The Prisma client is
 * passed in (auth.ts passes the app's; tests pass one on a local database).
 */

export type UpSignInOutcome =
    /** This Ultimate Pianist account is already linked: sign in as that user. */
    | { kind: 'linked'; userId: string; photoBackfilled: boolean }
    /** First sign-in, no matching email: a new Musical Bio account was made. */
    | { kind: 'created'; userId: string; username: string }
    /** The email already has a Musical Bio account: prove its password to link. */
    | { kind: 'needs-password'; userId: string; linkToken: string }
    /** Ultimate Pianist sent no usable (or a verified-false) email: cannot create. */
    | { kind: 'no-email' };

function isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002';
}

export async function findLinkedUserId(db: PrismaClient, providerAccountId: string): Promise<string | null> {
    const account = await db.account.findUnique({
        where: { provider_providerAccountId: { provider: UP_PROVIDER_ID, providerAccountId } },
        select: { userId: true },
    });
    return account?.userId ?? null;
}

/** Creates the user, profile, starter groups and the account link in one transaction. */
export async function createUserFromUpProfile(
    db: PrismaClient,
    profile: UpProfile,
): Promise<{ userId: string; username: string }> {
    const candidates = usernameCandidates(profile);
    for (let attempt = 0; ; attempt++) {
        const rows = await db.user.findMany({
            where: { OR: candidates.map((c) => ({ username: { startsWith: c, mode: 'insensitive' as const } })) },
            select: { username: true },
        });
        const username = pickAvailableUsername(candidates, new Set(rows.map((r) => r.username.toLowerCase())));
        const data = buildNewUserData(profile, username);
        try {
            const userId = await db.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        ...data.user,
                        profile: { create: data.profile },
                        accounts: { create: data.account },
                    },
                    select: { id: true },
                });
                await tx.group.createMany({ data: data.groups.map((g) => ({ ...g, userId: user.id })) });
                return user.id;
            });
            return { userId, username };
        } catch (error) {
            // Someone took the username (or the email) between our read and write: re-pick.
            if (isUniqueViolation(error) && attempt < 2) continue;
            throw error;
        }
    }
}

/**
 * Sets the profile photo from Ultimate Pianist only while the profile has none.
 * A single conditional update, so a photo the person set is never overwritten
 * (not even by a sign-in racing with their edit). True when it set one.
 */
export async function backfillProfileImage(db: PrismaClient, userId: string, imageUrl: string | null): Promise<boolean> {
    if (!imageUrl) return false;
    const { count } = await db.profile.updateMany({
        where: { userId, OR: [{ imageUrl: null }, { imageUrl: '' }] },
        data: { imageUrl },
    });
    return count > 0;
}

async function linkedOutcome(db: PrismaClient, userId: string, profile: UpProfile): Promise<UpSignInOutcome> {
    let photoBackfilled = false;
    try {
        photoBackfilled = await backfillProfileImage(db, userId, profile.imageUrl);
    } catch (error) {
        // Never block a sign-in over the photo.
        console.error('Ultimate Pianist photo backfill failed:', error instanceof Error ? error.message : 'error');
    }
    return { kind: 'linked', userId, photoBackfilled };
}

export async function resolveUpSignIn(
    db: PrismaClient,
    profile: UpProfile,
    secret: string,
): Promise<UpSignInOutcome> {
    const linked = await findLinkedUserId(db, profile.providerAccountId);
    if (linked) return linkedOutcome(db, linked, profile);

    if (!profile.email || profile.emailVerified === false) return { kind: 'no-email' };

    const existing = await db.user.findFirst({
        where: { email: { equals: profile.email, mode: 'insensitive' } },
        select: { id: true },
    });
    if (existing) {
        const linkToken = signLinkToken(
            { userId: existing.id, provider: UP_PROVIDER_ID, providerAccountId: profile.providerAccountId },
            secret,
        );
        return { kind: 'needs-password', userId: existing.id, linkToken };
    }

    try {
        const created = await createUserFromUpProfile(db, profile);
        return { kind: 'created', ...created };
    } catch (error) {
        // A parallel first sign-in of the same account won the race: use its link.
        const raced = await findLinkedUserId(db, profile.providerAccountId);
        if (raced) return linkedOutcome(db, raced, profile);
        throw error;
    }
}

/**
 * After a successful password login: if the login carried a valid link token
 * for this very user, link the Ultimate Pianist account to it.
 * Returns true when a link was made (or already existed).
 */
export async function redeemLinkToken(
    db: PrismaClient,
    token: string,
    secret: string,
    loggedInEmail: string,
): Promise<boolean> {
    const payload = verifyLinkToken(token, secret);
    if (!payload || payload.provider !== UP_PROVIDER_ID) return false;

    const user = await db.user.findFirst({
        where: { email: { equals: loggedInEmail.trim(), mode: 'insensitive' } },
        select: { id: true },
    });
    if (!user || user.id !== payload.userId) return false;

    const already = await findLinkedUserId(db, payload.providerAccountId);
    if (already) return already === user.id;

    try {
        await db.account.create({
            data: { userId: user.id, provider: UP_PROVIDER_ID, providerAccountId: payload.providerAccountId },
        });
        return true;
    } catch (error) {
        // This user already has a different Ultimate Pianist account linked, or a race.
        if (isUniqueViolation(error)) return (await findLinkedUserId(db, payload.providerAccountId)) === user.id;
        throw error;
    }
}

/** Musical Bio's user fields for the session token, by user id. */
export async function sessionUser(db: PrismaClient, userId: string) {
    return db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, profile: { select: { name: true } } },
    });
}
