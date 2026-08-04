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

/**
 * Fetch per-session A/B rows from PostHog (same HogQL setup the per-link
 * analytics already use). One row per (variant, session) with pageview count,
 * link clicks, and total time on page.
 */
export async function fetchAbSessionRows(days: number): Promise<{ rows: AbSessionRow[]; error?: string }> {
    const projectId = process.env.POSTHOG_PROJECT_ID
    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

    if (!projectId || !apiKey) return { rows: [], error: "Missing PostHog config (POSTHOG_PROJECT_ID / POSTHOG_PERSONAL_API_KEY)" }
    const dayCount = Math.max(1, Math.min(90, Math.floor(days)))

    try {
        const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: {
                    kind: "HogQLQuery",
                    query: `SELECT properties.ab_variant AS variant,
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
                },
            }),
            cache: "no-store",
        })
        if (!res.ok) {
            const body = await res.text()
            return { rows: [], error: `PostHog ${res.status}: ${body.slice(0, 200)}` }
        }
        const data = await res.json()
        const rows: AbSessionRow[] = []
        for (const row of data.results || []) {
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
    } catch (e) {
        return { rows: [], error: String(e) }
    }
}
