import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authConfig } from './auth.config';
import {
    AB_COOKIE,
    AB_COOKIE_MAX_AGE,
    isActiveVariantKey,
    isKnownVariantKey,
    pickVariantKey,
} from './lib/ab/registry';

const { auth } = NextAuth(authConfig);

const RESERVED_FIRST_SEGMENTS = new Set(['admin', 'login', 'signup', 'api', '_next', 'favicon.ico']);

/** Public bio pages: `/`, `/u/<username>`, `/<username>` (pre-rewrite URLs). */
function isPublicBioPath(pathname: string): boolean {
    if (pathname === '/') return true;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0 || RESERVED_FIRST_SEGMENTS.has(segments[0])) return false;
    if (segments[0] === 'u') return segments.length >= 2;
    return true; // /<username> and /<username>/story
}

export default auth((req) => {
    const request = req as unknown as NextRequest;
    const { nextUrl } = request;

    if (!isPublicBioPath(nextUrl.pathname)) return;

    // Resolve the visitor's A/B variant: forced (?ab=2b) > sticky valid cookie
    // > fresh CSPRNG assignment. Every visitor gets a variant.
    const forced = nextUrl.searchParams.get('ab');
    const current = request.cookies.get(AB_COOKIE)?.value;

    let assigned: string | null = null;
    if (forced && isKnownVariantKey(forced) && forced !== current) {
        assigned = forced;
    } else if (!isActiveVariantKey(current)) {
        assigned = pickVariantKey();
    }
    if (!assigned) return; // sticky — keep existing cookie, nothing to stamp

    // Stamp the new variant onto the request cookies too, so this very
    // request's SSR already renders the assigned variant (no control flash).
    const headers = new Headers(request.headers);
    const otherCookies = request.cookies
        .getAll()
        .filter((c) => c.name !== AB_COOKIE)
        .map((c) => `${c.name}=${c.value}`);
    headers.set('cookie', [...otherCookies, `${AB_COOKIE}=${assigned}`].join('; '));

    const res = NextResponse.next({ request: { headers } });
    res.cookies.set(AB_COOKIE, assigned, {
        maxAge: AB_COOKIE_MAX_AGE,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false, // client JS must read it to tag analytics events
    });
    return res;
});

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (images, etc)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|webp|ico|css|js)).*)',
    ],
};
