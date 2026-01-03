"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTimelineEvents } from "@/app/actions/timeline"
import { TimelineEditor } from "@/components/admin/timeline-editor"
import { Button } from "@/components/ui/button"
import { Eye, ChevronLeft } from "lucide-react"
import Link from "next/link"

import { TimelineLayoutToggle } from "@/components/admin/timeline-layout-toggle"
import { prisma } from "@/lib/prisma"

export default async function TimelineBuilderPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const events = await getTimelineEvents()
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true }
    })
    const profile = user?.profile

    // Calculate Stats
    const totalEvents = events.length

    let yearsCovered = 0
    let timelineSpan = "N/A"

    if (totalEvents > 0) {
        const years = events.map(e => e.year)
        const uniqueYears = new Set(years)
        yearsCovered = uniqueYears.size

        const minYear = Math.min(...years)
        const maxYear = Math.max(...years)
        timelineSpan = `${minYear} - ${maxYear}`
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin">
                        <Button variant="ghost" className="mb-4 pl-0 text-zinc-400 hover:text-white hover:bg-transparent">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Admin
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Timeline Builder</h1>
                    <p className="text-zinc-400">Drag and drop to reorder your milestones</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/u/${session.user.username}/story`} target="_blank">
                        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                        </Button>
                    </Link>

                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="text-sm font-medium text-zinc-400">Total Events</div>
                    <div className="mt-2 text-3xl font-bold text-white">{totalEvents}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="text-sm font-medium text-zinc-400">Years Covered</div>
                    <div className="mt-2 text-3xl font-bold text-white">{yearsCovered}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="text-sm font-medium text-zinc-400">Timeline Span</div>
                    <div className="mt-2 text-3xl font-bold text-white">{timelineSpan}</div>
                </div>
            </div>

            {/* Layout Toggle */}
            <div className="flex justify-end">
                <div className="w-full md:w-auto">
                    <TimelineLayoutToggle currentLayout={profile?.timelineLayout || "editorial"} />
                </div>
            </div>

            <TimelineEditor initialEvents={events} userId={session.user.id} />
        </div>
    )
}
