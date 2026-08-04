import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authConfig } from './auth.config';
import {
    AB_ADMIN_COOKIE,
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

function clientIp(request: NextRequest): string {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
    return request.headers.get('x-real-ip')?.trim() ?? '';
}

/**
 * AB_EXCLUDED_IPS: comma-separated. Exact IPs ("73.92.14.5") or prefixes
 * ending in "." / ":" ("73.92.14." matches the whole /24, "2601:1c0:" a v6 block).
 */
function isExcludedIp(ip: string): boolean {
    if (!ip) return false;
    const entries = (process.env.AB_EXCLUDED_IPS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    return entries.some((e) => (e.endsWith('.') || e.endsWith(':') ? ip.startsWith(e) : ip === e));
}

export default auth((req) => {
    const request = req as unknown as NextRequest;
    const { nextUrl } = request;

    if (!isPublicBioPath(nextUrl.pathname)) return;

    // Admin viewers (logged-in session, or an excluded IP) never enter the
    // experiment: no random assignment, and the admin cookie tells the client
    // tracker to send no A/B events. Forced ?ab= previews still work.
    const isAdminViewer = !!req.auth?.user || isExcludedIp(clientIp(request));
    const hadAdminCookie = request.cookies.get(AB_ADMIN_COOKIE)?.value === '1';

    // Resolve the visitor's A/B variant: forced (?ab=2b) > sticky valid cookie
    // > fresh CSPRNG assignment.
    const forced = nextUrl.searchParams.get('ab');
    const current = request.cookies.get(AB_COOKIE)?.value;

    let assigned: string | null = null;
    if (forced && isKnownVariantKey(forced) && forced !== current) {
        assigned = forced;
    } else if (!isAdminViewer && !isActiveVariantKey(current)) {
        assigned = pickVariantKey();
    }

    const adminCookieChanged = isAdminViewer !== hadAdminCookie;
    if (!assigned && !adminCookieChanged) return; // nothing to stamp

    // Stamp the new variant onto the request cookies too, so this very
    // request's SSR already renders the assigned variant (no control flash).
    const headers = new Headers(request.headers);
    if (assigned) {
        const otherCookies = request.cookies
            .getAll()
            .filter((c) => c.name !== AB_COOKIE)
            .map((c) => `${c.name}=${c.value}`);
        headers.set('cookie', [...otherCookies, `${AB_COOKIE}=${assigned}`].join('; '));
    }

    const res = NextResponse.next(assigned ? { request: { headers } } : undefined);
    if (assigned) {
        res.cookies.set(AB_COOKIE, assigned, {
            maxAge: AB_COOKIE_MAX_AGE,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false, // client JS must read it to tag analytics events
        });
    }
    if (adminCookieChanged) {
        if (isAdminViewer) {
            res.cookies.set(AB_ADMIN_COOKIE, '1', {
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: false, // read by the client tracker
            });
        } else {
            res.cookies.set(AB_ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
        }
    }
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
