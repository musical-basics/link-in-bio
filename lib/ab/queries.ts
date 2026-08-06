import type { AbSessionRow } from "./scoring"

/**
 * HogQL filter mirroring the middleware's AB_EXCLUDED_IPS exclusion, so admin
 * events are also scrubbed retroactively (events sent before the exclusion
 * existed, or from clients with stale variant cookies).
 */
function excludedIpFilter(): string {
    const entries = (process.env.AB_EXCLUDED_IPS ?? "")
        .split(",")
        .map((s) => s.trim().replace(/[^0-9a-fA-F.:]/g, ""))
        .filter(Boolean)
    if (entries.length === 0) return ""
    const conds = entries.map((e) =>
        e.endsWith(".") || e.endsWith(":")
            ? `startsWith(toString(properties.$ip), '${e}')`
            : `toString(properties.$ip) = '${e}'`,
    )
    return ` AND NOT (${conds.join(" OR ")})`
}

async function hogql(query: string): Promise<{ results: any[][]; error?: string }> {
    const projectId = process.env.POSTHOG_PROJECT_ID
    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

    if (!projectId || !apiKey) return { results: [], error: "Missing PostHog config (POSTHOG_PROJECT_ID / POSTHOG_PERSONAL_API_KEY)" }

    try {
        const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
            cache: "no-store",
        })
        if (!res.ok) {
            const body = await res.text()
            return { results: [], error: `PostHog ${res.status}: ${body.slice(0, 200)}` }
        }
        const data = await res.json()
        return { results: data.results || [] }
    } catch (e) {
        return { results: [], error: String(e) }
    }
}

/**
 * Fetch per-session A/B rows from PostHog (same HogQL setup the per-link
 * analytics already use). One row per (variant, session) with pageview count,
 * link clicks, and total time on page.
 */
export async function fetchAbSessionRows(days: number): Promise<{ rows: AbSessionRow[]; error?: string }> {
    const dayCount = Math.max(1, Math.min(90, Math.floor(days)))
    const { results, error } = await hogql(
        `SELECT properties.ab_variant AS variant,
                coalesce(toString(properties.$session_id), toString(distinct_id)) AS session,
                countIf(event = 'ab_page_view') AS pageviews,
                countIf(event = 'link_clicked') AS clicks,
                sumIf(toFloat(properties.duration_seconds), event = 'ab_page_leave') AS duration_seconds
         FROM events
         WHERE properties.ab_variant IS NOT NULL
           AND properties.ab_variant != ''
           AND event IN ('ab_page_view', 'ab_page_leave', 'link_clicked')
           AND timestamp >= now() - interval ${dayCount} day${excludedIpFilter()}
         GROUP BY variant, session`,
    )
    if (error) return { rows: [], error }

    const rows: AbSessionRow[] = []
    for (const row of results) {
        const [variant, session, pageviews, clicks, duration] = row
        if (!variant) continue
        rows.push({
            variant: String(variant),
            session: String(session ?? ""),
            pageviews: Number(pageviews) || 0,
            clicks: Number(clicks) || 0,
            durationSeconds: Number(duration) || 0,
        })
    }
    return { rows }
}

export interface TrafficStats {
    pageviews: number
    visitors: number
    clicks: number
    /** clicks / pageviews (0..1) */
    ctr: number
    topLinks: { name: string; clicks: number }[]
    referrers: { name: string; views: number }[]
    errors: string[]
}

/** Public-page filter for site-wide traffic queries (admin/auth pages excluded). */
const PUBLIC_URL_FILTER = `
           AND properties.$current_url NOT ILIKE '%/admin%'
           AND properties.$current_url NOT ILIKE '%/login%'
           AND properties.$current_url NOT ILIKE '%/signup%'`

/**
 * Overall traffic analytics (all visitors, not just A/B-relevant events),
 * with the same admin-IP scrubbing as the A/B queries.
 */
export async function fetchTrafficStats(days: number): Promise<TrafficStats> {
    const dayCount = Math.max(1, Math.min(90, Math.floor(days)))
    const window = ` AND timestamp >= now() - interval ${dayCount} day${excludedIpFilter()}`

    const [totals, topLinks, referrers] = await Promise.all([
        hogql(
            `SELECT countIf(event = '$pageview') AS views,
                    uniqIf(distinct_id, event = '$pageview') AS visitors,
                    countIf(event = 'link_clicked') AS clicks
             FROM events
             WHERE event IN ('$pageview', 'link_clicked')${PUBLIC_URL_FILTER}${window}`,
        ),
        hogql(
            `SELECT properties.link_title AS title, count() AS clicks
             FROM events
             WHERE event = 'link_clicked'
               AND properties.link_title IS NOT NULL${window}
             GROUP BY title
             ORDER BY clicks DESC
             LIMIT 8`,
        ),
        hogql(
            `SELECT coalesce(nullIf(properties.$referrer, ''), '$direct') AS ref, count() AS views
             FROM events
             WHERE event = '$pageview'${PUBLIC_URL_FILTER}${window}
             GROUP BY ref
             ORDER BY views DESC
             LIMIT 5`,
        ),
    ])

    const [views, visitors, clicks] = totals.results[0] ?? [0, 0, 0]
    const pageviews = Number(views) || 0
    return {
        pageviews,
        visitors: Number(visitors) || 0,
        clicks: Number(clicks) || 0,
        ctr: pageviews > 0 ? (Number(clicks) || 0) / pageviews : 0,
        topLinks: topLinks.results
            .filter(([name]) => name)
            .map(([name, c]) => ({ name: String(name), clicks: Number(c) || 0 })),
        referrers: referrers.results.map(([ref, v]) => ({
            name: ref === "$direct" ? "Direct" : String(ref),
            views: Number(v) || 0,
        })),
        errors: [totals.error, topLinks.error, referrers.error].filter((e): e is string => !!e),
    }
}
