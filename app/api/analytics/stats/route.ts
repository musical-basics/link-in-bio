import { auth } from "@/auth"
import { NextResponse } from "next/server"

type QueryError = { query: string; status: number; detail: string }

export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get("dateRange") || "7d"
    const days = dateRange === "30d" ? 30 : 7

    const projectId = process.env.POSTHOG_PROJECT_ID
    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

    const empty = {
        views: 0, clicks: 0, ctr: 0,
        chartFn: { dates: [] as string[], views: [] as number[], clicks: [] as number[] },
        topLinks: [] as { name: string; value: number }[],
        referrers: [] as { name: string; value: number }[],
    }

    if (!projectId || !apiKey) {
        return NextResponse.json({
            ...empty,
            errors: [{ query: "config", status: 500, detail: "Missing POSTHOG_PROJECT_ID or POSTHOG_PERSONAL_API_KEY" }],
        })
    }

    const rawUsername = session.user.username || ""
    if (!/^[A-Za-z0-9_.-]{1,64}$/.test(rawUsername)) {
        return NextResponse.json({
            ...empty,
            errors: [{ query: "config", status: 400, detail: "session username failed validation" }],
        })
    }
    const urlPattern = `%${rawUsername}%`
    const errors: QueryError[] = []

    async function hogql(label: string, query: string): Promise<any[][] | null> {
        try {
            const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
            })
            const text = await res.text()
            if (!res.ok) {
                errors.push({ query: label, status: res.status, detail: text.slice(0, 300) })
                return null
            }
            const parsed = JSON.parse(text)
            if (parsed.error) {
                errors.push({ query: label, status: res.status, detail: String(parsed.error).slice(0, 300) })
                return null
            }
            return parsed.results || []
        } catch (e) {
            errors.push({ query: label, status: 0, detail: String(e) })
            return null
        }
    }

    const chart = await hogql(
        "chart",
        `SELECT toDate(timestamp) AS day,
                countIf(event = '$pageview' AND properties.$current_url ILIKE '${urlPattern}') AS views,
                countIf(event = 'link_clicked' AND properties.$current_url ILIKE '${urlPattern}') AS clicks
         FROM events
         WHERE timestamp > now() - interval ${days} day
         GROUP BY day
         ORDER BY day`
    )

    const dates: string[] = []
    const viewsSeries: number[] = []
    const clicksSeries: number[] = []
    let totalViews = 0
    let totalClicks = 0
    for (const row of chart || []) {
        const [day, v, c] = row
        dates.push(String(day))
        viewsSeries.push(Number(v) || 0)
        clicksSeries.push(Number(c) || 0)
        totalViews += Number(v) || 0
        totalClicks += Number(c) || 0
    }

    const topLinksRows = await hogql(
        "topLinks",
        `SELECT properties.link_title AS title, count() AS clicks
         FROM events
         WHERE event = 'link_clicked'
           AND properties.$current_url ILIKE '${urlPattern}'
           AND timestamp > now() - interval ${days} day
         GROUP BY title
         ORDER BY clicks DESC
         LIMIT 5`
    )
    const topLinks = (topLinksRows || [])
        .filter(([title]) => title)
        .map(([title, value]) => ({ name: String(title), value: Number(value) || 0 }))

    const referrerRows = await hogql(
        "referrers",
        `SELECT coalesce(nullIf(properties.$referrer, ''), '$direct') AS ref, count() AS views
         FROM events
         WHERE event = '$pageview'
           AND properties.$current_url ILIKE '${urlPattern}'
           AND timestamp > now() - interval ${days} day
         GROUP BY ref
         ORDER BY views DESC
         LIMIT 5`
    )
    const referrers = (referrerRows || []).map(([ref, value]) => ({
        name: ref === "$direct" ? "Direct" : String(ref),
        value: Number(value) || 0,
    }))

    return NextResponse.json({
        views: totalViews,
        clicks: totalClicks,
        ctr: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0,
        chartFn: { dates, views: viewsSeries, clicks: clicksSeries },
        topLinks,
        referrers,
        errors,
    })
}
