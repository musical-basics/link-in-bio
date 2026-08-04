/**
 * Pure scoring engine for the A/B test. Feed it per-session rows (one row per
 * session per variant, from PostHog) and it produces ranked variant stats.
 *
 * We optimize for: CTR (link clicks), time on page, and low bounce rate.
 * Points per session (capped per session so one hyperactive visitor cannot
 * buy a variant the leaderboard):
 *   - link click: 5 pts each, capped at 15 (3 clicks)
 *   - time on page: 1 pt per 15s, capped at 5 (75s+)
 *   - non-bounce bonus: 3 pts (bounce = no clicks and under 10s on page)
 */

export interface AbSessionRow {
    variant: string
    session: string
    pageviews: number
    clicks: number
    durationSeconds: number
}

export const AB_SCORING = {
    pointsPerClick: 5,
    maxClickPoints: 15,
    secondsPerTimePoint: 15,
    maxTimePoints: 5,
    nonBouncePoints: 3,
    bounceMaxSeconds: 10,
} as const

export interface VariantStats {
    key: string
    sessions: number
    pageviews: number
    clicks: number
    /** share of sessions with at least one link click (0..1) */
    ctr: number
    clicksPerSession: number
    avgDurationSeconds: number
    /** share of sessions that bounced (0..1) */
    bounceRate: number
    totalPoints: number
    avgPoints: number
}

export function sessionPoints(row: AbSessionRow): number {
    const s = AB_SCORING
    const clickPts = Math.min(row.clicks * s.pointsPerClick, s.maxClickPoints)
    const timePts = Math.min(Math.floor(row.durationSeconds / s.secondsPerTimePoint), s.maxTimePoints)
    const bounced = row.clicks === 0 && row.durationSeconds < s.bounceMaxSeconds
    return clickPts + timePts + (bounced ? 0 : s.nonBouncePoints)
}

export function isBounce(row: AbSessionRow): boolean {
    return row.clicks === 0 && row.durationSeconds < AB_SCORING.bounceMaxSeconds
}

/** Aggregate per-session rows into ranked per-variant stats (best first). */
export function computeVariantStats(rows: AbSessionRow[]): VariantStats[] {
    const byVariant = new Map<string, AbSessionRow[]>()
    for (const row of rows) {
        if (!row.variant) continue
        const list = byVariant.get(row.variant) ?? []
        list.push(row)
        byVariant.set(row.variant, list)
    }

    const stats: VariantStats[] = []
    for (const [key, sessions] of byVariant) {
        const n = sessions.length
        const clicks = sessions.reduce((s, r) => s + r.clicks, 0)
        const pageviews = sessions.reduce((s, r) => s + r.pageviews, 0)
        const duration = sessions.reduce((s, r) => s + r.durationSeconds, 0)
        const clickingSessions = sessions.filter((r) => r.clicks > 0).length
        const bounces = sessions.filter(isBounce).length
        const totalPoints = sessions.reduce((s, r) => s + sessionPoints(r), 0)
        stats.push({
            key,
            sessions: n,
            pageviews,
            clicks,
            ctr: n ? clickingSessions / n : 0,
            clicksPerSession: n ? clicks / n : 0,
            avgDurationSeconds: n ? duration / n : 0,
            bounceRate: n ? bounces / n : 0,
            totalPoints,
            avgPoints: n ? totalPoints / n : 0,
        })
    }

    return stats.sort((a, b) => b.avgPoints - a.avgPoints || b.sessions - a.sessions)
}

/**
 * Roll variant stats up to one dimension of the key: "format" groups 1a+1b+1c
 * into "1"; "order" groups 1a+2a+3a into "a". Recomputed from the same
 * session rows so averages stay session-weighted.
 */
export function rollUp(rows: AbSessionRow[], dimension: "format" | "order"): VariantStats[] {
    const re = /^(\d+)([a-z])$/
    const mapped = rows
        .map((r) => {
            const m = re.exec(r.variant)
            if (!m) return null
            return { ...r, variant: dimension === "format" ? m[1] : m[2] }
        })
        .filter((r): r is AbSessionRow => r !== null)
    return computeVariantStats(mapped)
}
