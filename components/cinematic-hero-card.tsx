"use client"

import type React from "react"

import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useRef } from "react"
import { usePostHog } from 'posthog-js/react'

interface CinematicHeroCardProps {
    headline: string
    subtitle: string
    videoUrl?: string
    ctaText?: string
    onCtaClick?: () => void
}

// Helper function to extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ]

    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
    }
    return null
}

export function CinematicHeroCard({
    headline,
    subtitle,
    videoUrl,
    ctaText = "View Timeline",
    onCtaClick,
}: CinematicHeroCardProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mousePosition = useRef({ x: 0, y: 0 })
    const posthog = usePostHog()

    // Check if the video URL is a YouTube URL
    const youtubeVideoId = videoUrl ? getYouTubeVideoId(videoUrl) : null

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        mousePosition.current = {
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height,
        }
    }

    // Split headline and subtitle for stagger animation
    const headlineWords = headline.split(" ")

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    }

    const wordVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut" as const,
            },
        },
    }

    const subtitleVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut" as const,
            },
        },
    }

    const buttonVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.8,
                delay: 0.4,
                ease: "easeOut" as const,
            },
        },
        hover: {
            scale: 1.05,
            transition: { duration: 0.3 },
        },
    }

    const arrowVariants = {
        rest: { x: -8, opacity: 0 },
        hover: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.3 },
        },
    }

    // Default video if none provided
    const defaultVideoUrl = "https://cdn.coverr.co/videos/coverr-playing-piano-close-up-5388/1080p.mp4"

    return (
        <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            initial="hidden"
            animate="visible"
            className="relative w-full"
        >
            {/* Background container with glassmorphism */}
            <div className="relative overflow-hidden rounded-xl">
                {youtubeVideoId ? (
                    // YouTube iframe embed - uses YouTube's bandwidth, not Supabase!
                    <iframe
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&mute=1&loop=1&playlist=${youtubeVideoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                        title="Background video"
                        allow="autoplay; encrypted-media"
                        style={{ border: 'none' }}
                    />
                ) : (
                    // Regular video element for direct MP4 URLs
                    <video className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline>
                        <source src={videoUrl || defaultVideoUrl} type="video/mp4" />
                    </video>
                )}

                <div className="absolute inset-0 bg-black/70" />

                {/* Subtle spotlight effect */}
                <motion.div
                    className="absolute inset-0 bg-radial opacity-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at ${mousePosition.current.x * 100}% ${mousePosition.current.y * 100}%, rgba(255, 255, 255, 0.08) 0%, rgba(0, 0, 0, 0) 70%)`,
                    }}
                    animate={{
                        opacity: 0.3,
                    }}
                    transition={{
                        duration: 0.3,
                    }}
                />

                {/* Subtle border effect */}
                <div className="absolute inset-0 rounded-xl border border-white/10" />

                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-transparent" />

                {/* Content */}
                <div className="relative px-6 py-10 sm:py-14 flex flex-col items-center text-center space-y-6">
                    {/* Headline with text gradient */}
                    <motion.div className="space-y-2" variants={containerVariants}>
                        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                            {headlineWords.map((word, idx) => (
                                <motion.span
                                    key={idx}
                                    variants={wordVariants}
                                    className="bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent text-2xl sm:text-3xl md:text-4xl font-light tracking-tight"
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </div>
                    </motion.div>

                    {/* Subtitle */}
                    <motion.p
                        variants={subtitleVariants}
                        className="text-gray-400 text-sm sm:text-base font-light leading-relaxed max-w-md"
                    >
                        {subtitle}
                    </motion.p>

                    {/* CTA Button - Modern filled style */}
                    <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        onClick={() => {
                            console.log("🔥 Firing link_clicked for: Hero CTA")
                            posthog?.capture('link_clicked', {
                                link_id: 'hero_cta',
                                link_url: '/story', // Fallback or derived from context if available, but for now specific to CTA
                                link_title: ctaText,
                                section: 'hero'
                            })
                            onCtaClick?.()
                        }}
                        className="group relative mt-2 px-8 py-3 rounded-full text-sm font-medium text-white overflow-hidden"
                    >
                        {/* Gradient background - grey/white */}
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-600 via-zinc-500 to-zinc-400" />

                        {/* Shimmer effect on hover */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                            whileHover={{ translateX: "100%" }}
                            transition={{ duration: 0.6 }}
                        />

                        {/* Button content */}
                        <div className="relative flex items-center justify-center gap-2">
                            <span>{ctaText}</span>
                            <motion.div
                                initial={{ x: 0 }}
                                whileHover={{ x: 4 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ArrowRight className="w-4 h-4" />
                            </motion.div>
                        </div>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}
