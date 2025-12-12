import { auth } from "@/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const session = await auth()

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get("dateRange") || "7d"

    // Determine date_from based on range
    const dateFrom = dateRange === "30d" ? "-30d" : "-7d"

    const projectId = process.env.POSTHOG_PROJECT_ID
    const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

    if (!projectId || !apiKey) {
        return new NextResponse("Missing PostHog Configuration", { status: 500 })
    }

    // Identify the user's profile path to filter events
    // Assuming format /u/[username] or /[username]
    // The previous implementation moved story to /u/[username]/story, but main profile is at /u/[username]
    // We want to track views on their profile.
    // Let's filter by current_url containing their username.
    const username = session.user.username

    try {
        // 1. Total Views (Unique users seeing the profile)
        // We can use the 'trend' endpoint
        const viewsResponse = await fetch(`${host}/api/projects/${projectId}/insights/trend/?events=[{"id":"$pageview","math":"dau","properties":[{"key":"$current_url","value":"${username}","operator":"icontains"}]}]&date_from=${dateFrom}`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        })
        const viewsData = await viewsResponse.json()
        const totalViews = viewsData.result?.[0]?.count || 0
        const viewsChart = viewsData.result?.[0]?.data || []
        const viewsDays = viewsData.result?.[0]?.days || []

        // 2. Total Clicks (Total link_clicked events)
        const clicksResponse = await fetch(`${host}/api/projects/${projectId}/insights/trend/?events=[{"id":"link_clicked","math":"total","properties":[{"key":"$current_url","value":"${username}","operator":"icontains"}]}]&date_from=${dateFrom}`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        })
        const clicksData = await clicksResponse.json()
        const totalClicks = clicksData.result?.[0]?.count || 0
        const clicksChart = clicksData.result?.[0]?.data || []

        // 3. Top Links (Breakdown by link_title)
        const topLinksResponse = await fetch(`${host}/api/projects/${projectId}/insights/trend/?events=[{"id":"link_clicked","math":"total"}]&properties=[{"key":"link_title","type":"event"}]&date_from=${dateFrom}&filter_test_accounts=true`, { // Adding filter roughly
            headers: { Authorization: `Bearer ${apiKey}` }
        })
        // Note: For breakdown, the structure is slightly different. Using /insights/trend with breakdown might be better but query needs to be precise.
        // Let's trust simpler aggregation for now or use the 'breakdown' param.
        // Actually, let's use a simpler query for breakdown if the above is hard to parse in one go.
        // PostHog API is complex. simplified approach:
        // We will fetch breakdown by link_title
        const breakdownResponse = await fetch(`${host}/api/projects/${projectId}/insights/trend/?events=[{"id":"link_clicked","math":"total"}]&breakdown=link_title&breakdown_type=event&date_from=${dateFrom}`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        })
        const breakdownData = await breakdownResponse.json()

        const topLinks = breakdownData.result?.map((item: any) => ({
            name: item.label,
            value: item.count
        })).sort((a: any, b: any) => b.value - a.value).slice(0, 5) || []


        // 4. Referrers
        // Breakdown $pageview by $referrer
        const referrerResponse = await fetch(`${host}/api/projects/${projectId}/insights/trend/?events=[{"id":"$pageview","math":"total","properties":[{"key":"$current_url","value":"${username}","operator":"icontains"}]}]&breakdown=$referrer&breakdown_type=event&date_from=${dateFrom}`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        })
        const referrerData = await referrerResponse.json()
        const referrers = referrerData.result?.map((item: any) => ({
            name: item.label === "$direct" ? "Direct" : item.label,
            value: item.count
        })).sort((a: any, b: any) => b.value - a.value).slice(0, 5) || []


        return NextResponse.json({
            views: totalViews,
            clicks: totalClicks,
            ctr: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0,
            chartFn: {
                dates: viewsDays,
                views: viewsChart,
                clicks: clicksChart
            },
            topLinks,
            referrers
        })

    } catch (error) {
        console.error("Analytics API Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
