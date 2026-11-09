/**
 * A/B test registry — the single file you edit to operate the test.
 *
 * The model (simplified from AB-TESTING-SYSTEM.md — no purchases here):
 * a variant key is `<format><order>` e.g. "2b".
 *   - The NUMBER is a formatting/styling family (theme + visual treatment).
 *   - The LETTER is a link-ordering strategy (which link is pushed to the top).
 * The active pool is the cartesian product of active formats × active orders,
 * minus any keys listed in `disabledKeys`.
 *
 * Every visitor is assigned a variant (CSPRNG, weighted) by the middleware and
 * keeps it for 30 days (sticky). Force a specific variant with `?ab=2b`.
 *
 * Never reuse a retired id — its historical analytics would pollute a new test.
 *
 * This module must stay edge-safe: pure data + pure functions, no imports of
 * prisma/node APIs (it is bundled into middleware).
 */

export interface AbFormat {
    /** digits only — the "number" part of the variant key */
    id: string
    name: string
    /** Force a theme, or null to keep whatever the profile owner selected */
    theme: "classic" | "cinematic" | null
    /** Optional CSS style preset applied via [data-ab-style] (see globals.css) */
    styleKey: string | null
    active: boolean
    weight?: number
}

export interface AbOrder {
    /** single letter a–z — the "letter" part of the variant key */
    id: string
    name: string
    /**
     * Keywords matched case-insensitively against link title + URL.
     * Matching links are pinned to the top (and their group becomes the first
     * group). Empty array = the owner's manual order, untouched.
     */
    pinKeywords: string[]
    active: boolean
    weight?: number
}

export interface AbRegistry {
    formats: AbFormat[]
    orders: AbOrder[]
    /** Individual format×order combos to exclude from assignment, e.g. ["3c"] */
    disabledKeys: string[]
    /** First day of the test (YYYY-MM-DD, UTC); start of the dashboard's "whole test" range. */
    startedOn: string
    /**
     * Day the test was closed (YYYY-MM-DD), or null while it runs. Closed means:
     * no assignment, no mb_ab cookie (existing ones are cleared), no A/B events,
     * and every bio page renders its owner's own theme and link order.
     * `?ab=<key>` still previews a variant for admin viewers only.
     */
    closedOn: string | null
    /** One-paragraph final result, shown on the dashboard once closed. */
    result: string | null
}

export const AB_COOKIE = "mb_ab"
export const AB_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
/** Set by middleware for admin viewers (logged in or AB_EXCLUDED_IPS match).
 *  The client tracker sends no A/B events while it is present. */
export const AB_ADMIN_COOKIE = "mb_ab_x"

export const abRegistry: AbRegistry = {
    formats: [
        {
            id: "1",
            name: "Owner default",
            theme: null, // whatever theme is set in the admin (currently classic dark)
            styleKey: null,
            // Retired 2026-08-14: worst format in two independent readings
            // (42% CTR / 47% bounce vs 59% / 27% for the rest).
            active: false,
        },
        {
            id: "2",
            name: "Cinematic",
            theme: "cinematic",
            styleKey: null,
            active: true,
        },
        {
            id: "3",
            name: "Classic light",
            theme: "classic",
            styleKey: "light",
            active: true,
        },
    ],
    orders: [
        {
            id: "a",
            name: "Owner order",
            pinKeywords: [],
            // Retired 2026-08-14: worst ordering in two independent readings
            // (43% CTR / 48% bounce vs 60% / 25% for the rest).
            active: false,
        },
        {
            id: "b",
            name: "Masterclass first",
            // No link's title or URL ever matched these, so b never pinned
            // anything: in practice it was the owner's order (brief #85).
            pinKeywords: ["masterclass", "master class", "course", "class"],
            active: true,
        },
        {
            id: "c",
            name: "YouTube first",
            pinKeywords: ["youtube", "youtu.be"],
            active: true,
        },
    ],
    disabledKeys: [],
    startedOn: "2026-08-04",
    closedOn: "2026-11-09",
    result:
        "Formatting: Cinematic (2) beat Classic light (3) — +0.74 avg points/session (95% CI +0.07 to +1.42) " +
        "and 7 points less bounce (p = 0.03), 798 sessions since 08-14. Link order: no difference between " +
        "b and c (p > 0.6). b never pinned anything (no link matched its keywords), so it was really the " +
        "owner's own order vs YouTube first. Live since closing: each owner's own theme and link order " +
        "(Lionel's own theme is Cinematic, the winner).",
}

export interface AbVariant {
    key: string
    format: AbFormat
    order: AbOrder
    weight: number
}

const KEY_RE = /^(\d+)([a-z])$/

function validateRegistry(reg: AbRegistry): void {
    const formatIds = new Set<string>()
    for (const f of reg.formats) {
        if (!/^\d+$/.test(f.id)) throw new Error(`AB registry: format id "${f.id}" must be digits`)
        if (formatIds.has(f.id)) throw new Error(`AB registry: duplicate format id "${f.id}"`)
        formatIds.add(f.id)
        if (f.weight !== undefined && !(f.weight > 0)) throw new Error(`AB registry: format "${f.id}" weight must be > 0`)
    }
    const orderIds = new Set<string>()
    for (const o of reg.orders) {
        if (!/^[a-z]$/.test(o.id)) throw new Error(`AB registry: order id "${o.id}" must be a single letter`)
        if (orderIds.has(o.id)) throw new Error(`AB registry: duplicate order id "${o.id}"`)
        orderIds.add(o.id)
        if (o.weight !== undefined && !(o.weight > 0)) throw new Error(`AB registry: order "${o.id}" weight must be > 0`)
    }
    for (const key of reg.disabledKeys) {
        const m = KEY_RE.exec(key)
        if (!m || !formatIds.has(m[1]) || !orderIds.has(m[2])) {
            throw new Error(`AB registry: disabledKeys entry "${key}" does not match any format×order combo`)
        }
    }
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    if (!DATE_RE.test(reg.startedOn)) throw new Error(`AB registry: startedOn "${reg.startedOn}" must be YYYY-MM-DD`)
    if (reg.closedOn !== null) {
        if (!DATE_RE.test(reg.closedOn)) throw new Error(`AB registry: closedOn "${reg.closedOn}" must be YYYY-MM-DD`)
        if (reg.closedOn < reg.startedOn) throw new Error("AB registry: closedOn is before startedOn")
    }
}

// Fail the build (module load) on a bad registry instead of mis-routing traffic.
validateRegistry(abRegistry)

/** True once the test is closed (registry.closedOn is set). */
export function isTestClosed(reg: AbRegistry = abRegistry): boolean {
    return reg.closedOn !== null
}

/** Every combo in the registry, active or not (dashboard shows all). */
export function allVariants(reg: AbRegistry = abRegistry): AbVariant[] {
    const out: AbVariant[] = []
    for (const f of reg.formats) {
        for (const o of reg.orders) {
            out.push({ key: `${f.id}${o.id}`, format: f, order: o, weight: (f.weight ?? 1) * (o.weight ?? 1) })
        }
    }
    return out
}

/** The assignable pool. Empty once the test is closed. */
export function activeVariants(reg: AbRegistry = abRegistry): AbVariant[] {
    if (isTestClosed(reg)) return []
    return allVariants(reg).filter(
        (v) => v.format.active && v.order.active && !reg.disabledKeys.includes(v.key),
    )
}

/** Known = parseable against the current registry (active or not). */
export function resolveVariant(key: string | undefined | null, reg: AbRegistry = abRegistry): AbVariant | null {
    if (!key) return null
    return allVariants(reg).find((v) => v.key === key) ?? null
}

export function isActiveVariantKey(key: string | undefined | null, reg: AbRegistry = abRegistry): boolean {
    if (!key) return false
    return activeVariants(reg).some((v) => v.key === key)
}

export function isKnownVariantKey(key: string | undefined | null, reg: AbRegistry = abRegistry): boolean {
    return resolveVariant(key, reg) !== null
}

/**
 * Weighted random pick from the active pool (null when the pool is empty,
 * e.g. once the test is closed).
 * CSPRNG only — Math.random can repeat across invocations in reused edge
 * isolates and pin every visitor to one variant (see AB-TESTING-SYSTEM.md §4).
 */
export function pickVariantKey(reg: AbRegistry = abRegistry): string | null {
    const pool = activeVariants(reg)
    if (pool.length === 0) return null
    const total = pool.reduce((sum, v) => sum + v.weight, 0)
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    let point = (buf[0] / 0x1_0000_0000) * total
    for (const v of pool) {
        point -= v.weight
        if (point < 0) return v.key
    }
    return pool[pool.length - 1].key
}
