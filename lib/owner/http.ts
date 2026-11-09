import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authenticateOwner, type Owner } from '@/lib/owner/auth';
import { OwnerError } from '@/lib/owner/store';

/** Same paths the admin's server actions revalidate after an edit. */
export function revalidateOwnerPages(username: string) {
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/u/${username}`);
    revalidatePath(`/u/${username.toLowerCase()}`);
}

type Params = Record<string, string>;
interface Ctx<P extends Params> {
    owner: Owner;
    req: Request;
    params: P;
    /** Parses the JSON body against a schema (400 on failure). */
    body<S extends ZodTypeAny>(schema: S): Promise<z.infer<S>>;
}

class BadRequest extends Error {}

/**
 * Wraps an owner API handler: HTTP Basic auth, JSON in and out, consistent
 * errors, and public-page revalidation after any mutation.
 */
export function ownerRoute<P extends Params = Params>(
    handler: (ctx: Ctx<P>) => Promise<unknown>,
    { mutates = true }: { mutates?: boolean } = {},
) {
    return async (req: Request, routeCtx: { params: Promise<P> }) => {
        try {
            const owner = await authenticateOwner(prisma, req.headers.get('authorization'));
            if (!owner) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="musical.bio owner API", charset="UTF-8"' } },
                );
            }
            const params = (await routeCtx?.params) ?? ({} as P);
            const body = async <S extends ZodTypeAny>(schema: S) => {
                let json: unknown;
                try {
                    json = await req.json();
                } catch {
                    throw new BadRequest('Body must be JSON');
                }
                return schema.parse(json);
            };
            const result = await handler({ owner, req, params, body });
            if (mutates) revalidateOwnerPages(owner.username);
            return NextResponse.json(result ?? { ok: true });
        } catch (error) {
            if (error instanceof ZodError) {
                return NextResponse.json(
                    { error: 'Invalid input', issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
                    { status: 400 },
                );
            }
            if (error instanceof BadRequest) return NextResponse.json({ error: error.message }, { status: 400 });
            if (error instanceof OwnerError) return NextResponse.json({ error: error.message }, { status: error.status });
            console.error('Owner API error:', error instanceof Error ? error.message : error);
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
    };
}
