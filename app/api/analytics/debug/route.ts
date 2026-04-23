import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET() {
    const session = await auth()
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const projectId = process.env.POSTHOG_PROJECT_ID
    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
    const publicKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

    const env_present = {
        POSTHOG_PROJECT_ID: Boolean(projectId),
        POSTHOG_PERSONAL_API_KEY: Boolean(apiKey),
        NEXT_PUBLIC_POSTHOG_KEY: Boolean(publicKey),
        NEXT_PUBLIC_POSTHOG_HOST: Boolean(process.env.NEXT_PUBLIC_POSTHOG_HOST),
    }

    if (!projectId || !apiKey) {
        return NextResponse.json({ env_present, error: "missing PostHog server-side env vars" }, { status: 200 })
    }

    async function probe(label: string, url: string) {
        try {
            const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
            const text = await res.text()
            let parsed: unknown
            try { parsed = JSON.parse(text) } catch { parsed = text.slice(0, 500) }
            return { label, status: res.status, ok: res.ok, body: parsed }
        } catch (e) {
            return { label, status: 0, ok: false, body: String(e) }
        }
    }

    const probes = await Promise.all([
        probe("project", `${host}/api/projects/${projectId}/`),
        probe("recent_events", `${host}/api/projects/${projectId}/events/?limit=10`),
        probe("recent_link_clicked", `${host}/api/projects/${projectId}/events/?event=link_clicked&limit=10`),
        probe("recent_pageview", `${host}/api/projects/${projectId}/events/?event=%24pageview&limit=10`),
    ])

    return NextResponse.json({
        session_user: { username: session.user.username, email: session.user.email },
        env_present,
        host,
        project_id: projectId,
        probes,
    })
}
