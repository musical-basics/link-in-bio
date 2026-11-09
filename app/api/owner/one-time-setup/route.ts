import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { applyAccountLinksMigration, inspectDatabase, setOwnerPassword } from '@/lib/owner/one-time-setup';

export const dynamic = 'force-dynamic';

/**
 * TEMPORARY (brief #61): delete this route right after it has been used once.
 *
 * POST with `Authorization: Bearer <ONE_TIME_SETUP_SECRET>` and a JSON body:
 *   {"action": "inspect"}                         read-only look at the schema and migration history
 *   {"action": "apply-migration"}                 idempotent add_account_links + history record
 *   {"action": "set-password", "email", "password"}  owner account only
 * Responds with results only; never echoes the password.
 */

function bearerOk(header: string | null): boolean {
    // A dedicated throwaway secret (Production only), removed together with this route.
    const secret = process.env.ONE_TIME_SETUP_SECRET;
    if (!secret || !header?.startsWith('Bearer ')) return false;
    const a = createHash('sha256').update(header.slice(7)).digest();
    const b = createHash('sha256').update(secret).digest();
    return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
    if (!bearerOk(req.headers.get('authorization'))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let body: { action?: unknown; email?: unknown; password?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
    }

    try {
        switch (body.action) {
            case 'inspect':
                return NextResponse.json({ ok: true, inspect: await inspectDatabase(prisma) });
            case 'apply-migration':
                return NextResponse.json({ ok: true, migration: await applyAccountLinksMigration(prisma) });
            case 'set-password': {
                if (typeof body.email !== 'string' || typeof body.password !== 'string') {
                    return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
                }
                const result = await setOwnerPassword(prisma, body.email, body.password);
                return NextResponse.json(result, { status: result.ok ? 200 : 400 });
            }
            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }
    } catch (error) {
        console.error('one-time-setup failed:', error instanceof Error ? error.message : 'unknown error');
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
    }
}
