'use server'

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
