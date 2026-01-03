"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import type { TimelineEvent } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Music, Video, Image as ImageIcon } from "lucide-react"

interface EditorialEvent {
    id: string
    title: string
    description: string | null
    year: number
    mediaType: string
    mediaUrl?: string | null
}

interface EditorialTimelineProps {
    events: EditorialEvent[]
}

export const EditorialTimeline = ({ events }: EditorialTimelineProps) => {
    const containerRef = useRef<HTMLDivElement>(null)

    // Sort events chronologically
    const sortedEvents = [...events].sort((a, b) => a.year - b.year)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    const opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1])
    const scale = useTransform(scrollYProgress, [0, 0.1], [0.95, 1])

    return (
        <div ref={containerRef} className="relative min-h-screen w-full py-20 px-4 md:px-8 overflow-hidden">
            <motion.div
                style={{ opacity, scale }}
                className="mx-auto max-w-7xl relative"
            >
                {/* Central Axis - Desktop Only */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px -ml-px hidden md:block">
                    <div className="h-full w-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                </div>

                {/* Mobile Axis - Left Side */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent md:hidden" />

                <div className="space-y-24 md:space-y-32">
                    {sortedEvents.map((event, index) => {
                        const isEven = index % 2 === 0

                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={cn(
                                    "relative flex flex-col md:flex-row items-center gap-8 md:gap-0",
                                    // Mobile: always align left (standard stack)
                                    // Desktop: Zig-zag based on index
                                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                                )}
                            >
                                {/* Visual Connector Node (Desktop) */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block z-20">
                                    <div className="h-4 w-4 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] ring-4 ring-black" />
                                </div>
                                {/* Visual Connector Node (Mobile) */}
                                <div className="absolute left-4 top-8 -translate-x-1/2 flex items-center justify-center md:hidden z-20">
                                    <div className="h-3 w-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)] ring-4 ring-black" />
                                </div>


                                {/* Text Side */}
                                <div className={cn(
                                    "w-full md:w-1/2 pl-12 md:pl-0 flex flex-col justify-center relative z-10",
                                    isEven ? "md:pr-24 md:text-right md:items-end" : "md:pl-24 md:text-left md:items-start"
                                )}>
                                    {/* Connector Line (Desktop) */}
                                    <div className={cn(
                                        "absolute top-1/2 h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent hidden md:block",
                                        isEven ? "right-0" : "left-0"
                                    )} />

                                    <div className="relative">
                                        {/* Year Background Typography */}
                                        <span className={cn(
                                            "absolute -top-16 md:-top-20 text-5xl md:text-7xl font-serif font-bold text-white/5 select-none pointer-events-none whitespace-nowrap z-0",
                                            isEven ? "md:right-0" : "md:left-0"
                                        )}>
                                            {event.year}
                                        </span>

                                        <h3 className="relative z-10 text-3xl font-serif font-medium text-white mb-4 tracking-tight drop-shadow-md">
                                            {event.title}
                                        </h3>
                                        <p className="relative z-10 text-zinc-400 font-serif leading-relaxed max-w-md text-base md:text-lg">
                                            {event.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Image Side */}
                                <div className={cn(
                                    "w-full md:w-1/2 pl-12 md:pl-0",
                                    isEven ? "md:pl-24" : "md:pr-24"
                                )}>
                                    {/* Connector Line (Desktop - Image Side - Optional visual balance) */}
                                    {/* <div className={cn(
                       "absolute top-1/2 h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent hidden md:block",
                       isEven ? "left-0" : "right-0"
                   )} /> */}

                                    <div className="group relative aspect-[4/3] w-full max-w-xl mx-auto md:mx-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-900/50 backdrop-blur-sm transition-transform duration-700 hover:scale-[1.02]">
                                        {/* Inner Glow */}
                                        <div className="absolute inset-0 z-10 box-decoration-clone bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none" />

                                        {(event.mediaUrl || event.mediaType) ? (
                                            (() => {
                                                const mediaSrc = event.mediaUrl || `/api/timeline/${event.id}/media`

                                                return event.mediaType === 'video' ? (
                                                    <video
                                                        src={mediaSrc}
                                                        className="h-full w-full object-cover opacity-80 transition-opacity duration-700 group-hover:opacity-100"
                                                        autoPlay muted loop playsInline
                                                    />
                                                ) : (
                                                    <img
                                                        src={mediaSrc}
                                                        alt={event.title}
                                                        className="h-full w-full object-cover opacity-80 transition-opacity duration-700 group-hover:opacity-100"
                                                    />
                                                )
                                            })()
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                                                <div className="text-zinc-700">No Media</div>
                                            </div>
                                        )}

                                        {/* Glass Reflection */}
                                        <div className="absolute inset-0 z-20 bg-gradient-to-tr from-white/0 via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                                    </div>
                                </div>

                            </motion.div>
                        )
                    })}
                </div>
            </motion.div>
        </div>
    )
}
