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
                              AND timestamp > now() - interval ${dayCount} day
                            GROUP BY day
                            ORDER BY day`,
                },
            }),
            next: { revalidate: 60 },
        })
        if (!res.ok) {
            const body = await res.text()
            return { ...empty, error: `${res.status}: ${body.slice(0, 200)}` }
        }
        const data = await res.json()
        const daily: { date: string; clicks: number }[] = []
        let total = 0
        for (const row of data.results || []) {
            const [date, clicks] = row
            const n = Number(clicks) || 0
            daily.push({ date: String(date), clicks: n })
            total += n
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
