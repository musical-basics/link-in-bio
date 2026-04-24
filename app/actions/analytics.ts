'use server'

export type LinkAnalytics = {
    daily: { date: string; clicks: number }[]
    total: number
    error?: string
}

export async function getLinkAnalytics(linkId: string, days = 7): Promise<LinkAnalytics> {
    const projectId = process.env.POSTHOG_PROJECT_ID
    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

    const empty: LinkAnalytics = { daily: [], total: 0 }
    if (!projectId || !apiKey) return { ...empty, error: 'Missing PostHog config' }
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(linkId)) return { ...empty, error: 'Invalid link id' }
    const dayCount = days === 30 ? 30 : 7

    try {
        const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: {
                    kind: 'HogQLQuery',
                    query: `SELECT toDate(timestamp) AS day, count() AS clicks
                            FROM events
                            WHERE event = 'link_clicked'
                              AND properties.link_id = '${linkId}'
                              AND toDate(timestamp) >= toDate(now()) - interval ${dayCount - 1} day
                            GROUP BY day
                            ORDER BY day`,
                },
            }),
            cache: 'no-store',
        })
        if (!res.ok) {
            const body = await res.text()
            return { ...empty, error: `${res.status}: ${body.slice(0, 200)}` }
        }
        const data = await res.json()
        const counts = new Map<string, number>()
        for (const row of data.results || []) {
            const [date, clicks] = row
            counts.set(String(date), Number(clicks) || 0)
        }
        const daily: { date: string; clicks: number }[] = []
        let total = 0
        const today = new Date()
        for (let i = dayCount - 1; i >= 0; i--) {
            const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i))
            const key = d.toISOString().slice(0, 10)
            const c = counts.get(key) ?? 0
            daily.push({ date: key, clicks: c })
            total += c
        }
        return { daily, total }
    } catch (e) {
        return { ...empty, error: String(e) }
    }
}

export async function getLinkClickCounts(): Promise<Record<string, number>> {
    const projectId = process.env.POSTHOG_PROJECT_ID
    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

    if (!projectId || !apiKey) return {}

    try {
        const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: {
                    kind: 'HogQLQuery',
                    query: `SELECT properties.link_id AS id, count() AS clicks
                            FROM events
                            WHERE event = 'link_clicked'
                              AND timestamp > now() - interval 30 day
                              AND properties.link_id IS NOT NULL
                            GROUP BY id`,
                },
            }),
            next: { revalidate: 60 },
        })
        if (!res.ok) return {}
        const data = await res.json()
        const out: Record<string, number> = {}
        for (const row of data.results || []) {
            const [id, clicks] = row
            if (id) out[String(id)] = Number(clicks) || 0
        }
        return out
    } catch {
        return {}
    }
}
