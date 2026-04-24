"use client"

import { useEffect, useState } from "react"
import type { Link as LinkType } from "@/lib/data"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { getLinkAnalytics, type LinkAnalytics } from "@/app/actions/analytics"
import { MousePointerClick } from "lucide-react"

interface Props {
    link: LinkType | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function LinkAnalyticsSheet({ link, open, onOpenChange }: Props) {
    const [data, setData] = useState<LinkAnalytics | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!open || !link) return
        setLoading(true)
        setData(null)
        getLinkAnalytics(link.id, 7)
            .then(setData)
            .finally(() => setLoading(false))
    }, [open, link])

    const chartData = (data?.daily || []).map(d => ({
        name: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        clicks: d.clicks,
    }))

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>{link?.title}</SheetTitle>
                    <SheetDescription className="break-all">{link?.url}</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {data?.error && (
                        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
                            {data.error}
                        </div>
                    )}

                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MousePointerClick className="h-4 w-4" />
                            Clicks (last 7 days)
                        </div>
                        <div className="mt-1 text-3xl font-bold">
                            {loading ? "…" : data?.total ?? 0}
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-4">
                        <div className="text-sm font-medium mb-2">Daily breakdown</div>
                        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
                        {!loading && chartData.length === 0 && (
                            <div className="text-sm text-muted-foreground">No clicks in the last 7 days.</div>
                        )}
                        {!loading && chartData.length > 0 && (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="linkClicksFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-800" horizontal vertical={false} />
                                    <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }} labelStyle={{ color: "#fff" }} />
                                    <Area type="monotone" dataKey="clicks" stroke="#82ca9d" fillOpacity={1} fill="url(#linkClicksFill)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
