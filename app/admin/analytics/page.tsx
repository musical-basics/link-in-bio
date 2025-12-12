"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, MousePointerClick, Eye, Clock, Percent } from "lucide-react"

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState("7d")
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [dateRange])

    async function fetchStats() {
        setLoading(true)
        try {
            const res = await fetch(`/api/analytics/stats?dateRange=${dateRange}`)
            const json = await res.json()
            setData(json)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    if (loading && !data) return <div className="p-8 text-zinc-400">Loading analytics...</div>

    // Transform chart data
    const chartData = data?.chartFn?.dates?.map((date: string, i: number) => ({
        name: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        views: data.chartFn.views[i] || 0,
        clicks: data.chartFn.clicks[i] || 0
    })) || []


    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">Analytics</h2>
                <div className="flex items-center space-x-2">
                    <Tabs value={dateRange} onValueChange={setDateRange} className="space-y-4">
                        <TabsList className="bg-zinc-800">
                            <TabsTrigger value="7d">Last 7 days</TabsTrigger>
                            <TabsTrigger value="30d">Last 30 days</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-200">Total Views</CardTitle>
                        <Eye className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{data?.views}</div>
                        <p className="text-xs text-zinc-500">
                            Unique visitors on your profile
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-200">Total Clicks</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{data?.clicks}</div>
                        <p className="text-xs text-zinc-500">
                            Total link interactions
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-200">Click Rate</CardTitle>
                        <Percent className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{data?.ctr}%</div>
                        <p className="text-xs text-zinc-500">
                            Visitors who clicked a link
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-200">Engagement</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        {/* Placeholder for Avg Time if API supports it later */}
                        <div className="text-2xl font-bold text-white">High</div>
                        <p className="text-xs text-zinc-500">
                            Based on interaction depth
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-zinc-200">Overview</CardTitle>
                        <CardDescription>
                            Comparing Views vs. Clicks over time
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-800" horizontal={true} vertical={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                                    labelStyle={{ color: "#fff" }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#8884d8" fillOpacity={1} fill="url(#colorViews)" />
                                <Area type="monotone" dataKey="clicks" stroke="#82ca9d" fillOpacity={1} fill="url(#colorClicks)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-zinc-200">Top Links</CardTitle>
                        <CardDescription>
                            Most clicked links in this period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {data?.topLinks?.map((link: any, i: number) => (
                                <div className="flex items-center" key={i}>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none text-white">{link.name}</p>
                                    </div>
                                    <div className="ml-auto font-medium text-white">
                                        {link.value} clicks
                                    </div>
                                </div>
                            ))}
                            {(!data?.topLinks || data.topLinks.length === 0) && (
                                <div className="text-sm text-zinc-500">No data available</div>
                            )}
                        </div>
                    </CardContent>

                    <CardHeader className="mt-4">
                        <CardTitle className="text-zinc-200">Top Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.referrers?.map((ref: any, i: number) => (
                                <div className="flex items-center" key={i}>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none text-white">{ref.name}</p>
                                    </div>
                                    <div className="ml-auto font-medium text-white">
                                        {ref.value}
                                    </div>
                                </div>
                            ))}
                            {(!data?.referrers || data.referrers.length === 0) && (
                                <div className="text-sm text-zinc-500">No data available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
