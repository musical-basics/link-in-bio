import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { abRegistry, allVariants } from "./registry"
import type { VariantStats } from "./scoring"

export interface AbReportData {
    generatedAt: Date
    daily: VariantStats[]
    weekly: VariantStats[]
    weeklyFormats: VariantStats[]
    weeklyOrders: VariantStats[]
}

const PAGE_W = 612 // US Letter
const PAGE_H = 792
const MARGIN = 48

function variantLabel(key: string): string {
    const v = allVariants().find((x) => x.key === key)
    if (v) return `${v.format.name} / ${v.order.name}`
    const f = abRegistry.formats.find((x) => x.id === key)
    if (f) return f.name
    const o = abRegistry.orders.find((x) => x.id === key)
    if (o) return o.name
    return "(retired)"
}

/** Build the daily A/B performance report as a PDF. */
export async function buildAbReportPdf(data: AbReportData): Promise<Uint8Array> {
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)

    let page = doc.addPage([PAGE_W, PAGE_H])
    let y = PAGE_H - MARGIN

    const ensureRoom = (needed: number) => {
        if (y - needed < MARGIN) {
            page = doc.addPage([PAGE_W, PAGE_H])
            y = PAGE_H - MARGIN
        }
    }
    const text = (s: string, x: number, size: number, f: PDFFont, color = rgb(0.1, 0.1, 0.12)) => {
        page.drawText(s, { x, y, size, font: f, color })
    }

    // Header
    text("musical.bio — Daily A/B Test Report", MARGIN, 20, bold)
    y -= 24
    text(
        `Generated ${data.generatedAt.toISOString().slice(0, 16).replace("T", " ")} UTC`,
        MARGIN, 10, font, rgb(0.45, 0.45, 0.5),
    )
    y -= 14
    text(
        "Variant key: number = formatting, letter = link order. Ranked by avg points/session (clicks, time on page, non-bounce).",
        MARGIN, 9, font, rgb(0.45, 0.45, 0.5),
    )
    y -= 28

    const drawTable = (title: string, stats: VariantStats[]) => {
        ensureRoom(60)
        text(title, MARGIN, 14, bold)
        y -= 20

        const cols = [
            { label: "#", x: MARGIN, align: "l" as const },
            { label: "Variant", x: MARGIN + 22, align: "l" as const },
            { label: "Sessions", x: 330, align: "r" as const },
            { label: "Clicks", x: 384, align: "r" as const },
            { label: "CTR", x: 432, align: "r" as const },
            { label: "Avg time", x: 486, align: "r" as const },
            { label: "Bounce", x: 532, align: "r" as const },
            { label: "Pts", x: 566, align: "r" as const },
        ]
        const cell = (s: string, col: (typeof cols)[number], size: number, f: PDFFont, color?: ReturnType<typeof rgb>) => {
            const w = f.widthOfTextAtSize(s, size)
            page.drawText(s, { x: col.align === "r" ? col.x - w : col.x, y, size, font: f, color: color ?? rgb(0.1, 0.1, 0.12) })
        }

        for (const c of cols) cell(c.label, c, 8, bold, rgb(0.45, 0.45, 0.5))
        y -= 6
        page.drawLine({
            start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y },
            thickness: 0.7, color: rgb(0.8, 0.8, 0.82),
        })
        y -= 13

        if (stats.length === 0) {
            text("No sessions recorded in this window.", MARGIN, 10, font, rgb(0.5, 0.5, 0.55))
            y -= 24
            return
        }

        stats.forEach((s, i) => {
            ensureRoom(16)
            const rowFont = i === 0 ? bold : font
            cell(String(i + 1), cols[0], 9, rowFont)
            cell(`${s.key}  ${variantLabel(s.key)}`.slice(0, 52), cols[1], 9, rowFont)
            cell(String(s.sessions), cols[2], 9, rowFont)
            cell(String(s.clicks), cols[3], 9, rowFont)
            cell(`${(s.ctr * 100).toFixed(1)}%`, cols[4], 9, rowFont)
            cell(`${Math.round(s.avgDurationSeconds)}s`, cols[5], 9, rowFont)
            cell(`${(s.bounceRate * 100).toFixed(1)}%`, cols[6], 9, rowFont)
            cell(s.avgPoints.toFixed(1), cols[7], 9, rowFont)
            y -= 15
        })
        y -= 16
    }

    const leader = data.daily.find((s) => s.sessions > 0) ?? data.weekly.find((s) => s.sessions > 0)
    if (leader) {
        ensureRoom(20)
        text(
            `Current leader: ${leader.key} (${variantLabel(leader.key)}) — ${leader.avgPoints.toFixed(1)} avg pts, ` +
            `${(leader.ctr * 100).toFixed(1)}% CTR, ${Math.round(leader.avgDurationSeconds)}s avg time, ` +
            `${(leader.bounceRate * 100).toFixed(1)}% bounce`,
            MARGIN, 11, bold, rgb(0.05, 0.45, 0.25),
        )
        y -= 26
    }

    drawTable("Last 24 hours — variant leaderboard", data.daily)
    drawTable("Last 7 days — variant leaderboard", data.weekly)
    drawTable("Last 7 days — by formatting (number)", data.weeklyFormats)
    drawTable("Last 7 days — by link order (letter)", data.weeklyOrders)

    return doc.save()
}

/** Email the PDF via Resend's HTTP API. */
export async function emailAbReport(
    pdf: Uint8Array,
    data: AbReportData,
    toOverride?: string,
): Promise<{ ok: boolean; detail: string }> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return { ok: false, detail: "RESEND_API_KEY is not set" }

    const to = toOverride || process.env.AB_REPORT_TO || "support@musicalbasics.com"
    const from = process.env.AB_REPORT_FROM || "musical.bio reports <onboarding@resend.dev>"
    const dateStr = data.generatedAt.toISOString().slice(0, 10)
    const leader = data.daily.find((s) => s.sessions > 0) ?? data.weekly.find((s) => s.sessions > 0)

    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject: `A/B test report ${dateStr}${leader ? ` — leader: ${leader.key}` : ""}`,
            text:
                `Daily A/B test report for musical.bio (${dateStr}).\n\n` +
                (leader
                    ? `Best performing variant: ${leader.key} (${variantLabel(leader.key)}) with ` +
                      `${leader.avgPoints.toFixed(1)} avg points/session, ${(leader.ctr * 100).toFixed(1)}% CTR, ` +
                      `${Math.round(leader.avgDurationSeconds)}s avg time on page, ` +
                      `${(leader.bounceRate * 100).toFixed(1)}% bounce rate.\n\n`
                    : "No sessions recorded yet.\n\n") +
                "Full leaderboard attached as PDF. Live dashboard: /admin/ab-tests",
            attachments: [
                {
                    filename: `ab-report-${dateStr}.pdf`,
                    content: Buffer.from(pdf).toString("base64"),
                },
            ],
        }),
    })

    const body = await res.text()
    return { ok: res.ok, detail: res.ok ? "sent" : `Resend ${res.status}: ${body.slice(0, 300)}` }
}
