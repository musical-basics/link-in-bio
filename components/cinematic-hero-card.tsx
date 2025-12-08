"use client"

import type React from "react"

import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useRef } from "react"

interface CinematicHeroCardProps {
    headline: string
    subtitle: string
    videoUrl?: string
    ctaText?: string
    onCtaClick?: () => void
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
                <video className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline>
                    <source src={videoUrl || defaultVideoUrl} type="video/mp4" />
                </video>

                <div className="absolute inset-0 bg-black/60" />

                {/* Subtle spotlight effect */}
                <motion.div
                    className="absolute inset-0 bg-radial opacity-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at ${mousePosition.current.x * 100}% ${mousePosition.current.y * 100}%, rgba(217, 119, 6, 0.1) 0%, rgba(0, 0, 0, 0) 70%)`,
                    }}
                    animate={{
                        opacity: 0.3,
                    }}
                    transition={{
                        duration: 0.3,
                    }}
                />

                {/* Pulsing border effect */}
                <motion.div
                    className="absolute inset-0 rounded-xl border border-amber-700/40"
                    animate={{
                        boxShadow: [
                            "0 0 20px rgba(217, 119, 6, 0.1)",
                            "0 0 40px rgba(217, 119, 6, 0.2)",
                            "0 0 20px rgba(217, 119, 6, 0.1)",
                        ],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                />

                {/* Glassmorphism backdrop */}
                <div className="absolute inset-0 rounded-xl backdrop-blur-sm bg-gradient-to-br from-white/5 via-white/2 to-transparent" />

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

                    {/* CTA Button */}
                    <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        onClick={onCtaClick}
                        className="group relative mt-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-300"
                    >
                        {/* Button background with gradient on hover */}
                        <motion.div
                            className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 opacity-0 -z-10"
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        />

                        {/* Border */}
                        <div className="absolute inset-0 rounded-lg border border-amber-700/50 group-hover:border-amber-500/70 transition-colors duration-300" />

                        {/* Button content */}
                        <div className="relative flex items-center justify-center gap-2">
                            <motion.div variants={arrowVariants} initial="rest" whileHover="hover">
                                <ArrowRight className="w-4 h-4" />
                            </motion.div>
                            <span>{ctaText}</span>
                        </div>

                        {/* Subtle glow on hover */}
                        <motion.div
                            className="absolute inset-0 rounded-lg opacity-0 blur-lg -z-10"
                            whileHover={{
                                opacity: 1,
                                background: "rgba(217, 119, 6, 0.3)",
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}
