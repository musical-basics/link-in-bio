import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * A short-lived, signed note that "this Ultimate Pianist account wants to link
 * to Musical Bio user X". Issued when someone signs in with Ultimate Pianist
 * using an email that already has a Musical Bio account; redeemed only after
 * they log in with that account's password (no takeover by email alone).
 */
export interface LinkTokenPayload {
    userId: string;
    provider: string;
    providerAccountId: string;
    /** Expiry, ms since epoch. */
    exp: number;
}

export const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

function mac(body: string, secret: string): Buffer {
    return createHmac('sha256', secret).update(`mb-account-link:${body}`).digest();
}

export function signLinkToken(
    data: Omit<LinkTokenPayload, 'exp'>,
    secret: string,
    now: number = Date.now(),
): string {
    if (!secret) throw new Error('No secret to sign the link token with');
    const payload: LinkTokenPayload = { ...data, exp: now + LINK_TOKEN_TTL_MS };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${body}.${mac(body, secret).toString('base64url')}`;
}

export function verifyLinkToken(
    token: string | null | undefined,
    secret: string,
    now: number = Date.now(),
): LinkTokenPayload | null {
    if (!token || !secret) return null;
    const [body, sig, extra] = token.split('.');
    if (!body || !sig || extra !== undefined) return null;

    const given = Buffer.from(sig, 'base64url');
    const expected = mac(body, secret);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

    try {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as LinkTokenPayload;
        if (
            typeof payload.userId !== 'string' ||
            typeof payload.provider !== 'string' ||
            typeof payload.providerAccountId !== 'string' ||
            typeof payload.exp !== 'number' ||
            payload.exp <= now
        ) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
}
