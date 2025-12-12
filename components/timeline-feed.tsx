"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Music, Mic, Youtube, Award, MapPin } from "lucide-react"
import type React from "react"



// Adapting Prisma type for checking media type
import type { TimelineEvent } from "@prisma/client"

interface EventCardProps {
  event: TimelineEvent
  isVisible: boolean
  onActiveChange?: (isActive: boolean) => void
}

const EventCard: React.FC<EventCardProps> = ({ event, isVisible, onActiveChange }) => {
  const [imageLoaded, setImageLoaded] = useState(false)

  // Map icon based on title/description or use generic (since DB doesn't store icon name yet)
  // For now, defaulting to Music icon, or we could add an icon field to DB later.
  const Icon = Music

  return (
    <motion.div
      id={`event-${event.id}`}
      className="flex flex-col gap-6 scroll-mt-24"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      onViewportEnter={() => onActiveChange?.(true)}
      onViewportLeave={() => onActiveChange?.(false)}
    >
      <motion.div
        className="group relative overflow-hidden rounded-lg border border-white/10 bg-zinc-900/30 shadow-2xl shadow-black/50 backdrop-blur-sm transition-all duration-500"
        whileHover={{
          scale: 1.02,
          rotateY: 2,
          rotateX: -2,
        }}
        style={{ transformStyle: "preserve-3d", perspective: 1000 }}
        transition={{ duration: 0.4 }}
      >
        {/* Hover glow effect */}
        <div
          className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ boxShadow: "0 0 30px -15px rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.2)" }}
        />

        <div className="relative h-96 w-full overflow-hidden">
          {/* Media Layer */}
          <motion.div
            className="absolute inset-0 h-full w-full"
            initial={{ scale: 1.1, filter: "grayscale(1)" }}
            whileInView={{
              scale: 1,
              filter: "grayscale(0)",
            }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2 }}
          >
            {(event.mediaUrl || event.mediaType) ? (
              (() => {
                const mediaSrc = event.mediaUrl || `/api/timeline/${event.id}/media`

                return event.mediaType === "image" ? (
                  <img
                    src={mediaSrc}
                    alt={event.title}
                    className="h-full w-full object-cover"
                    onLoad={() => setImageLoaded(true)}
                  />
                ) : (
                  <video
                    src={mediaSrc}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onLoadedMetadata={() => setImageLoaded(true)}
                  />
                )
              })()
            ) : (
              <div className="h-full w-full bg-zinc-900 flex items-center justify-center">
                <Music className="h-20 w-20 text-zinc-700" />
              </div>
            )}
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />

          <div className="absolute inset-0 flex flex-col justify-end p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3 text-amber-50/90 backdrop-blur-sm ring-1 ring-white/20">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-3xl font-bold text-white drop-shadow-2xl">{event.title}</h3>
            </div>

            <p className="max-w-2xl text-base text-zinc-400 drop-shadow-lg">{event.description}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

import type { TimelineEvent as PrismaTimelineEvent } from "@prisma/client"

interface TimelineFeedProps {
  events: PrismaTimelineEvent[]
}

export const TimelineFeed: React.FC<TimelineFeedProps> = ({ events }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 30%", "end 70%"],
  })

  // Sort events chronologically by year
  const sortedEvents = [...events].sort((a, b) => a.year - b.year)

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const [activeYear, setActiveYear] = useState<number | null>(null)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)

  // Memoize events by year using sortedEvents
  const eventsByYear = sortedEvents.reduce(
    (acc, event) => {
      if (!acc[event.year]) {
        acc[event.year] = []
      }
      acc[event.year].push(event)
      return acc
    },
    {} as Record<number, PrismaTimelineEvent[]>,
  )

  const sortedYears = Object.keys(eventsByYear).map(Number).sort((a, b) => a - b)

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(`event-${elementId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const scrollToYear = (year: number) => {
    const yearEvents = eventsByYear[year]
    if (yearEvents && yearEvents.length > 0) {
      scrollToElement(yearEvents[0].id)
    }
  }

  return (
    <div ref={containerRef} className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-20 text-center">
          <motion.h2
            className="font-serif text-4xl font-bold text-white md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            The Journey
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-zinc-500"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            From first notes to the world stage
          </motion.p>
        </div>

        {/* Single Column Feed Layout */}
        <div className="relative">
          <div className="grid gap-0 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Sticky Years Navigation (Desktop Only) */}
            <div className="hidden lg:col-span-2 lg:block">
              <div className="sticky top-20 flex flex-col gap-12">
                {sortedYears.map((year) => {
                  const yearEvents = eventsByYear[year]
                  return (
                    <motion.div
                      key={year}
                      className="text-right"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.6 }}
                    >
                      <motion.button
                        onClick={() => scrollToYear(year)}
                        className="relative block w-full cursor-pointer text-right font-serif text-5xl font-bold text-amber-50/90 transition-all hover:scale-105"
                        animate={{
                          opacity: activeYear === year ? 1 : 0.3,
                          scale: activeYear === year ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                        style={{
                          textShadow:
                            activeYear === year
                              ? "0 0 40px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)"
                              : "none",
                        }}
                      >
                        {year}
                      </motion.button>

                      <div className="mt-3 flex flex-col gap-2">
                        {yearEvents.map((event) => (
                          <motion.button
                            key={event.id}
                            onClick={() => scrollToElement(event.id)}
                            className="cursor-pointer text-right text-sm text-zinc-500 transition-all hover:text-white"
                            animate={{
                              color: activeEventId === event.id ? "rgb(255, 255, 255)" : "rgb(113, 113, 122)",
                              opacity: activeEventId === event.id ? 1 : 0.6,
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            {event.title}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <div className="absolute left-[16.666%] top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/20 to-transparent lg:block">
              <motion.div
                className="w-full bg-gradient-to-b from-white/40 via-white/60 to-transparent"
                style={{ height: lineHeight }}
              />
            </div>

            {/* Right Column: Content Cards */}
            <div className="col-span-full space-y-20 lg:col-span-10">
              {sortedEvents.map((event, index) => (
                <div key={event.id}>
                  {/* Mobile Year Badge */}
                  <div className="mb-4 flex items-center gap-3 lg:hidden">
                    <span className="font-serif text-3xl font-bold text-amber-50/90">{event.year}</span>
                    <div className="h-px flex-grow bg-gradient-to-r from-white/20 to-transparent" />
                  </div>

                  <EventCard
                    event={event}
                    isVisible={true}
                    onActiveChange={(isActive) => {
                      if (isActive) {
                        setActiveYear(event.year)
                        setActiveEventId(event.id)
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
