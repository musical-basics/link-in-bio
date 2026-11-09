import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

/**
 * Owner API authentication: HTTP Basic (email:password) over HTTPS, checked
 * with bcrypt against the account's password, the same check as login.
 * Never logs or returns the password.
 */

export interface Owner {
    id: string;
    email: string;
    username: string;
}

/** A valid bcrypt hash of a random string: compared against when the email is unknown, so timing doesn't reveal which emails exist. */
const DUMMY_HASH = '$2b$10$OhT5aitNe1HCuO9KHlyzsuwRiYA5fmsth1e6UfUcmfsfXv8LUA/Q6';

export function parseBasicAuth(header: string | null | undefined): { email: string; password: string } | null {
    if (!header) return null;
    const match = /^Basic\s+([A-Za-z0-9+/=_-]+)\s*$/i.exec(header);
    if (!match) return null;
    let decoded: string;
    try {
        decoded = Buffer.from(match[1], 'base64').toString('utf8');
    } catch {
        return null;
    }
    const colon = decoded.indexOf(':');
    if (colon <= 0) return null;
    const email = decoded.slice(0, colon).trim();
    const password = decoded.slice(colon + 1);
    if (!email || !password || password.length > 512) return null;
    return { email, password };
}

export async function authenticateOwner(db: PrismaClient, authorization: string | null | undefined): Promise<Owner | null> {
    const creds = parseBasicAuth(authorization);
    if (!creds) return null;

    const user = await db.user.findFirst({
        where: { email: { equals: creds.email.toLowerCase(), mode: 'insensitive' } },
        select: { id: true, email: true, username: true, password: true },
    });
    const ok = await bcrypt.compare(creds.password, user?.password ?? DUMMY_HASH);
    if (!user || !user.password || !ok) return null;
    return { id: user.id, email: user.email, username: user.username };
}
