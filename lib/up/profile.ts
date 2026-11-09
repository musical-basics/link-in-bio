/**
 * "Sign in with Ultimate Pianist": turning an Ultimate Pianist (OIDC) profile
 * into a new Musical Bio account. Pure functions only (no DB, no env) so they
 * run under `node --test`; the DB side is lib/up/accounts.ts.
 *
 * Ultimate Pianist shares only the OIDC `profile` and `email` claims in v1:
 * name, username, picture, email (contract 2026-11-09).
 */

/** Ultimate Pianist's profile, normalized from whatever claims arrive. */
export interface UpProfile {
    /** OIDC `sub`: the stable Ultimate Pianist account id we link on. */
    providerAccountId: string;
    /** Lowercased and trimmed, or null when Ultimate Pianist sent none. */
    email: string | null;
    /** null when Ultimate Pianist did not say. */
    emailVerified: boolean | null;
    name: string | null;
    username: string | null;
    imageUrl: string | null;
}

function str(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

export function normalizeUpProfile(claims: Record<string, unknown>): UpProfile {
    const providerAccountId = str(claims.sub) ?? str(claims.id);
    if (!providerAccountId) throw new Error('Ultimate Pianist profile has no subject id');

    const given = str(claims.given_name);
    const family = str(claims.family_name);
    const name = str(claims.name) ?? (given || family ? [given, family].filter(Boolean).join(' ') : null);

    const picture = str(claims.picture) ?? str(claims.image);
    const imageUrl = picture && /^https:\/\//i.test(picture) ? picture : null;

    return {
        providerAccountId,
        email: str(claims.email)?.toLowerCase() ?? null,
        emailVerified: typeof claims.email_verified === 'boolean' ? claims.email_verified : null,
        name,
        username: str(claims.username) ?? str(claims.preferred_username) ?? str(claims.nickname),
        imageUrl,
    };
}

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const FALLBACK_USERNAME = 'pianist';

/**
 * Exact first path segments the app owns (next.config.mjs rewrites,
 * middleware.ts), plus a few kept free for future pages.
 */
const RESERVED_USERNAMES = new Set([
    'admin', 'login', 'signup', 'api', '_next', 'u', 'favicon', 'favicon.ico',
    'auth', 'story', 'www', 'help', 'about', 'terms', 'privacy', 'settings',
    'ultimatepianist', 'musicalbio',
]);

export function isReservedUsername(username: string): boolean {
    return RESERVED_USERNAMES.has(username);
}

/** Same character set the signup form allows: [a-z0-9_-], lowercase. */
export function slugifyUsername(input: string): string {
    return input
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '') // strip accents
        .toLowerCase()
        .replace(/[\s.]+/g, '') // "Lionel Yu" -> "lionelyu"
        .replace(/[^a-z0-9_-]/g, '')
        .replace(/[-_]{2,}/g, (m) => m[0])
        .replace(/^[-_]+/, '')
        .slice(0, USERNAME_MAX)
        .replace(/[-_]+$/, '');
}

function isUsable(slug: string): boolean {
    return slug.length >= USERNAME_MIN && !isReservedUsername(slug);
}

/** Preferred usernames, best first: UP username, then name, then email local part. */
export function usernameCandidates(profile: UpProfile): string[] {
    const raw = [profile.username, profile.name, profile.email?.split('@')[0] ?? null];
    const out: string[] = [];
    for (const r of raw) {
        if (!r) continue;
        const slug = slugifyUsername(r);
        if (isUsable(slug) && !out.includes(slug)) out.push(slug);
    }
    return out.length ? out : [FALLBACK_USERNAME];
}

/**
 * First free candidate as-is; otherwise the best candidate with the lowest
 * free number appended (lionelyu2, lionelyu3, ...), kept within USERNAME_MAX.
 * `taken` holds lowercase usernames already in use.
 */
export function pickAvailableUsername(
    candidates: string[],
    taken: ReadonlySet<string>,
    random: () => number = Math.random,
): string {
    for (const c of candidates) {
        if (!taken.has(c)) return c;
    }
    const base = candidates[0] ?? FALLBACK_USERNAME;
    for (let n = 2; n < 1000; n++) {
        const suffix = String(n);
        const candidate = base.slice(0, USERNAME_MAX - suffix.length) + suffix;
        if (!taken.has(candidate)) return candidate;
    }
    // 998 numbered variants taken: fall back to a random suffix.
    for (;;) {
        const suffix = Math.floor(random() * 1e6).toString(36);
        const candidate = base.slice(0, USERNAME_MAX - suffix.length - 1) + '-' + suffix;
        if (!taken.has(candidate)) return candidate;
    }
}

export const DEFAULT_BIO = 'Welcome to my page!';

/** Same starter groups the email signup seeds (app/actions/auth.ts). */
export const DEFAULT_GROUPS = [
    { name: 'Music', description: 'My latest releases', order: 1 },
    { name: 'Socials', description: 'Connect with me', order: 2 },
    { name: 'Work', description: 'Projects & Portfolio', order: 3 },
] as const;

/** The rows a new Musical Bio account starts with, from an Ultimate Pianist profile. */
export function buildNewUserData(profile: UpProfile, username: string) {
    if (!profile.email) throw new Error('Ultimate Pianist profile has no email');
    return {
        user: {
            email: profile.email,
            username,
            password: null,
        },
        profile: {
            name: profile.name ?? profile.username ?? username,
            bio: DEFAULT_BIO,
            imageUrl: profile.imageUrl,
            storageUsed: 0,
        },
        groups: DEFAULT_GROUPS.map((g) => ({ ...g })),
        account: {
            provider: 'ultimatepianist',
            providerAccountId: profile.providerAccountId,
        },
    };
}
