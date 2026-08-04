import Link from "next/link"
import { abRegistry, allVariants } from "@/lib/ab/registry"
import { fetchAbSessionRows } from "@/lib/ab/queries"
import { computeVariantStats, rollUp, type VariantStats } from "@/lib/ab/scoring"

export const dynamic = "force-dynamic"

const RANGES = [1, 7, 30] as const

function fmtPct(v: number) {
    return `${(v * 100).toFixed(1)}%`
}
function fmtSec(v: number) {
    return `${Math.round(v)}s`
}

function StatsTable({
    title,
    subtitle,
    stats,
    labelFor,
    inactiveKeys,
}: {
    title: string
    subtitle: string
    stats: VariantStats[]
    labelFor: (key: string) => string
    inactiveKeys?: Set<string>
}) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="border-b border-zinc-800 px-5 py-4">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <p className="text-sm text-zinc-400">{subtitle}</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                            <th className="px-5 py-3">#</th>
                            <th className="px-5 py-3">Variant</th>
                            <th className="px-5 py-3 text-right">Sessions</th>
                            <th className="px-5 py-3 text-right">Clicks</th>
                            <th className="px-5 py-3 text-right">CTR</th>
                            <th className="px-5 py-3 text-right">Avg time</th>
                            <th className="px-5 py-3 text-right">Bounce</th>
                            <th className="px-5 py-3 text-right">Avg points</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-5 py-6 text-center text-zinc-500">
                                    No data yet for this range.
                                </td>
                            </tr>
                        )}
                        {stats.map((s, i) => {
                            const inactive = inactiveKeys?.has(s.key)
                            return (
                                <tr key={s.key} className="border-t border-zinc-800/70 text-zinc-200">
                                    <td className="px-5 py-3 text-zinc-500">{i + 1}</td>
                                    <td className="px-5 py-3">
                                        <span className="font-mono font-semibold text-white">{s.key}</span>
                                        <span className="ml-2 text-zinc-400">{labelFor(s.key)}</span>
                                        {inactive && (
                                            <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">off</span>
                                        )}
                                        {i === 0 && s.sessions > 0 && (
                                            <span className="ml-2 rounded bg-emerald-900/60 px-1.5 py-0.5 text-xs text-emerald-300">
                                                leader
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-right">{s.sessions}</td>
                                    <td className="px-5 py-3 text-right">{s.clicks}</td>
                                    <td className="px-5 py-3 text-right">{fmtPct(s.ctr)}</td>
                                    <td className="px-5 py-3 text-right">{fmtSec(s.avgDurationSeconds)}</td>
                                    <td className="px-5 py-3 text-right">{fmtPct(s.bounceRate)}</td>
                                    <td className="px-5 py-3 text-right font-semibold text-white">{s.avgPoints.toFixed(1)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default async function AbTestsPage({
    searchParams,
}: {
    searchParams: Promise<{ days?: string }>
}) {
    const { days: daysParam } = await searchParams
    const days = RANGES.includes(Number(daysParam) as (typeof RANGES)[number]) ? Number(daysParam) : 7

    const { rows, error } = await fetchAbSessionRows(days)

    const variants = allVariants()
    const variantLabel = new Map(variants.map((v) => [v.key, `${v.format.name} · ${v.order.name}`]))
    const activeKeys = new Set(
        variants.filter((v) => v.format.active && v.order.active && !abRegistry.disabledKeys.includes(v.key)).map((v) => v.key),
    )

    // Show every registry combo (zeros included) plus any retired keys that still have data.
    const computed = computeVariantStats(rows)
    const byKey = new Map(computed.map((s) => [s.key, s]))
    const zero = (key: string): VariantStats => ({
        key, sessions: 0, pageviews: 0, clicks: 0, ctr: 0, clicksPerSession: 0,
        avgDurationSeconds: 0, bounceRate: 0, totalPoints: 0, avgPoints: 0,
    })
    const variantStats = [
        ...computed.filter((s) => variantLabel.has(s.key)),
        ...variants.filter((v) => !byKey.has(v.key)).map((v) => zero(v.key)),
    ]
    const retired = computed.filter((s) => !variantLabel.has(s.key))

    const formatStats = rollUp(rows, "format")
    const orderStats = rollUp(rows, "order")
    const formatLabel = new Map(abRegistry.formats.map((f) => [f.id, f.name]))
    const orderLabel = new Map(abRegistry.orders.map((o) => [o.id, o.name]))
    const inactiveVariantKeys = new Set(variants.map((v) => v.key).filter((k) => !activeKeys.has(k)))

    return (
        <div className="min-h-screen bg-black p-6 sm:p-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">A/B Tests</h1>
                        <p className="text-sm text-zinc-400">
                            Number = formatting, letter = link order. Ranked by avg points per session
                            (clicks, time on page, non-bounce). Preview any variant with <span className="font-mono">?ab=2b</span>.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {RANGES.map((r) => (
                            <Link
                                key={r}
                                href={`/admin/ab-tests?days=${r}`}
                                className={`rounded-md px-3 py-1.5 text-sm ${
                                    r === days ? "bg-zinc-100 text-zinc-900" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                }`}
                            >
                                {r === 1 ? "Today" : `${r} days`}
                            </Link>
                        ))}
                        <Link
                            href="/admin"
                            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
                        >
                            ← Admin
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="rounded-md border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
                        A/B analytics query failed: {error}
                    </div>
                )}

                <StatsTable
                    title="Variant leaderboard"
                    subtitle={`All format × order combinations, last ${days === 1 ? "day" : `${days} days`}`}
                    stats={variantStats}
                    labelFor={(k) => variantLabel.get(k) ?? ""}
                    inactiveKeys={inactiveVariantKeys}
                />

                <div className="grid gap-6 lg:grid-cols-2">
                    <StatsTable
                        title="By formatting"
                        subtitle="Rolled up across link orders (1a+1b+1c → 1)"
                        stats={formatStats}
                        labelFor={(k) => formatLabel.get(k) ?? ""}
                    />
                    <StatsTable
                        title="By link order"
                        subtitle="Rolled up across formats (1a+2a+3a → a)"
                        stats={orderStats}
                        labelFor={(k) => orderLabel.get(k) ?? ""}
                    />
                </div>

                {retired.length > 0 && (
                    <StatsTable
                        title="Retired variants"
                        subtitle="Keys with data that are no longer in the registry"
                        stats={retired}
                        labelFor={() => ""}
                    />
                )}
            </div>
        </div>
    )
}
