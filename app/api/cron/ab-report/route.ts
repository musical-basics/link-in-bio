import { NextResponse } from "next/server"
import { fetchAbSessionRows, fetchTrafficStats } from "@/lib/ab/queries"
import { computeVariantStats, rollUp } from "@/lib/ab/scoring"
import { buildAbReportPdf, emailAbReport } from "@/lib/ab/report"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Daily A/B report cron (see vercel.json). Computes the last-24h and 7-day
 * leaderboards, renders them to a PDF, and emails it to support@musicalbasics.com.
 *
 * Vercel calls this with `Authorization: Bearer ${CRON_SECRET}` when the
 * CRON_SECRET env var is set. Preview it manually in the browser with
 * `?preview=pdf` (returns the PDF instead of emailing, admin cookie not required
 * only when CRON_SECRET is unset in dev).
 */
export async function GET(req: Request) {
    const secret = process.env.CRON_SECRET
    const authorized = !secret || req.headers.get("authorization") === `Bearer ${secret}`
    if (!authorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [daily, weekly, dailyTraffic, weeklyTraffic] = await Promise.all([
        fetchAbSessionRows(1),
        fetchAbSessionRows(7),
        fetchTrafficStats(1),
        fetchTrafficStats(7),
    ])
    const errors = [daily.error, weekly.error, ...dailyTraffic.errors, ...weeklyTraffic.errors].filter(Boolean)

    const data = {
        generatedAt: new Date(),
        daily: computeVariantStats(daily.rows),
        weekly: computeVariantStats(weekly.rows),
        weeklyFormats: rollUp(weekly.rows, "format"),
        weeklyOrders: rollUp(weekly.rows, "order"),
        dailyTraffic,
        weeklyTraffic,
    }

    const pdf = await buildAbReportPdf(data)

    const url = new URL(req.url)
    if (url.searchParams.get("preview") === "pdf") {
        return new NextResponse(Buffer.from(pdf), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="ab-report.pdf"`,
            },
        })
    }

    // Cron-authorized test override, e.g. ?to=lionel@musicalbasics.com
    // (useful while the Resend domain is unverified and can only reach the
    // account owner's address).
    const sent = await emailAbReport(pdf, data, url.searchParams.get("to") ?? undefined)
    const status = sent.ok ? 200 : 500
    return NextResponse.json(
        {
            ok: sent.ok,
            email: sent.detail,
            dailySessions: data.daily.reduce((s, v) => s + v.sessions, 0),
            weeklySessions: data.weekly.reduce((s, v) => s + v.sessions, 0),
            queryErrors: errors,
        },
        { status },
    )
}
