/**
 * Ultimate Pianist sign-in settings. Everything is off until both
 * AUTH_ULTIMATEPIANIST_ID and AUTH_ULTIMATEPIANIST_SECRET are set (names fixed
 * by the contract with Ultimate Pianist, who put the keys into Vercel).
 */

export const UP_PROVIDER_ID = 'ultimatepianist';
export const UP_DEFAULT_ISSUER = 'https://clerk.ultimatepianist.com';
export const UP_SCOPES = 'openid profile email';
export const UP_FROM_PARAM = 'ultimatepianist';

type Env = Record<string, string | undefined>;

export interface UpConfig {
    clientId: string;
    clientSecret: string;
    issuer: string;
}

export function getUpConfig(env: Env = process.env): UpConfig | null {
    const clientId = env.AUTH_ULTIMATEPIANIST_ID?.trim();
    const clientSecret = env.AUTH_ULTIMATEPIANIST_SECRET?.trim();
    if (!clientId || !clientSecret) return null;
    const issuer = (env.AUTH_ULTIMATEPIANIST_ISSUER?.trim() || UP_DEFAULT_ISSUER).replace(/\/+$/, '');
    return { clientId, clientSecret, issuer };
}

export function isUpEnabled(env: Env = process.env): boolean {
    return getUpConfig(env) !== null;
}

/** ultimatepianist.com and any subdomain of it. */
export function isUltimatePianistHost(hostname: string): boolean {
    const h = hostname.toLowerCase().replace(/\.$/, '');
    return h === 'ultimatepianist.com' || h.endsWith('.ultimatepianist.com');
}

/** Did this visitor arrive from Ultimate Pianist? `?from=ultimatepianist`, or its referrer. */
export function isFromUltimatePianist(opts: { from?: string | string[] | null; referer?: string | null }): boolean {
    const from = Array.isArray(opts.from) ? opts.from[0] : opts.from;
    if (from?.toLowerCase() === UP_FROM_PARAM) return true;
    if (!opts.referer) return false;
    try {
        return isUltimatePianistHost(new URL(opts.referer).hostname);
    } catch {
        return false;
    }
}
