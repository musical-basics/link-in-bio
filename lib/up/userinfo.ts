/**
 * Auth.js builds an "oidc" provider's profile from the ID token only. Clerk's ID
 * token can leave out profile claims (the photo did not arrive on the first real
 * sign-in, 2026-11-09), while /oauth/userinfo carries them. When the ID token
 * lacks the picture, the name or the username, fill the gaps from userinfo.
 *
 * Pure apart from fetchUserinfo, whose fetch is injectable for tests.
 */

type Claims = Record<string, unknown>;

const present = (v: unknown) => (typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null);

/** True when the claims lack a picture, a name or a username. */
export function needsUserinfo(claims: Claims): boolean {
    const hasName = present(claims.name) || present(claims.given_name) || present(claims.family_name);
    const hasUsername = present(claims.preferred_username) || present(claims.username) || present(claims.nickname);
    return !present(claims.picture) || !hasName || !hasUsername;
}

/**
 * ID-token claims win wherever they have a value; userinfo only fills the gaps.
 * Userinfo for a different subject is ignored.
 */
export function mergeClaims(idClaims: Claims, userinfo: Claims | null, expectedSub: string): Claims {
    if (!userinfo || userinfo.sub !== expectedSub) return idClaims;
    const merged: Claims = {};
    for (const [k, v] of Object.entries(userinfo)) if (present(v)) merged[k] = v;
    for (const [k, v] of Object.entries(idClaims)) if (present(v)) merged[k] = v;
    return merged;
}

/** Claim names only (never values), for the sign-in log. */
export function claimNames(claims: Claims | null | undefined): string[] {
    return claims ? Object.keys(claims).filter((k) => present(claims[k])).sort() : [];
}

/**
 * The claims to build the Musical Bio profile from: the ID token's, plus
 * userinfo's for whatever the ID token left out. `log` lists claim names only.
 */
export async function gatherUpClaims(opts: {
    idClaims: Claims;
    sub: string;
    accessToken?: string | null;
    issuer: string;
    fetchImpl?: typeof fetch;
}): Promise<{ claims: Claims; log: { idToken: string[]; userinfo: string[] | null } }> {
    const idClaims = { ...opts.idClaims, sub: opts.sub };
    let userinfo: Claims | null = null;
    if (needsUserinfo(idClaims) && opts.accessToken) {
        userinfo = await fetchUserinfo(opts.issuer, opts.accessToken, opts.fetchImpl);
    }
    return {
        claims: mergeClaims(idClaims, userinfo, opts.sub),
        log: { idToken: claimNames(opts.idClaims), userinfo: userinfo ? claimNames(userinfo) : null },
    };
}

export function userinfoUrl(issuer: string): string {
    return `${issuer.replace(/\/+$/, '')}/oauth/userinfo`;
}

/** GET the userinfo endpoint with the access token. Null on any failure; never throws. */
export async function fetchUserinfo(
    issuer: string,
    accessToken: string,
    fetchImpl: typeof fetch = fetch,
): Promise<Claims | null> {
    try {
        const res = await fetchImpl(userinfoUrl(issuer), {
            headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
            console.warn(`Ultimate Pianist userinfo returned HTTP ${res.status}`);
            return null;
        }
        const body = await res.json();
        return body && typeof body === 'object' && !Array.isArray(body) ? (body as Claims) : null;
    } catch (error) {
        console.warn('Ultimate Pianist userinfo failed:', error instanceof Error ? error.name : 'error');
        return null;
    }
}
