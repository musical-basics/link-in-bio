"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
            {/* Spotlight gradient */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-white/[0.07] via-white/[0.02] to-transparent rounded-full blur-3xl opacity-50" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] mb-8"
                >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span className="text-sm text-zinc-300">New: Forever Free Plan Available</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="font-serif text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-6"
                >
                    Your Musical Journey.
                    <br />
                    <span className="text-zinc-400">One Link.</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    The only link-in-bio designed for artists who have a story to tell.
                    Showcase your concerts, releases, and milestones.
                </motion.p>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link href="/signup">
                        <Button
                            size="lg"
                            className="bg-white text-black hover:bg-zinc-200 px-8 py-6 text-lg font-medium rounded-full"
                        >
                            Create Free Profile
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="lg"
                        className="text-zinc-400 hover:text-white hover:bg-white/5 px-8 py-6 text-lg rounded-full"
                    >
                        <Play className="mr-2 h-5 w-5" />
                        Watch Demo
                    </Button>
                </motion.div>

                {/* Added Trust Indicator */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 text-xs text-zinc-500"
                >
                    No credit card required • Free forever plan available
                </motion.p>
            </div>

            {/* Floating Preview */}
            <motion.div
                initial={{ opacity: 0, y: 40, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative z-10 mt-16 md:mt-24 w-full max-w-4xl mx-auto perspective-1000"
            >
                <div className="relative transform rotate-x-2 hover:rotate-x-0 transition-transform duration-500">
                    <div className="absolute -inset-4 bg-gradient-to-b from-white/10 to-transparent rounded-3xl blur-xl opacity-50" />
                    <div className="relative rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-zinc-900/50">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                            </div>
                            <div className="flex-1 text-center">
                                <span className="text-xs text-zinc-500">musical.bio/lionelyu</span>
                            </div>
                        </div>
                        <div className="relative aspect-[16/10] bg-gradient-to-b from-zinc-900 to-black p-8">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-white/20 mb-4 overflow-hidden">
                                    <img src="/concert-pianist-profile-photo.jpg" alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <h3 className="text-xl font-serif text-white mb-1">Lionel Yu</h3>
                                <p className="text-sm text-zinc-400 mb-4">Concert Pianist, Composer</p>
                                <div className="flex gap-3 mb-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10" />
                                    ))}
                                </div>
                                <div className="w-full max-w-sm rounded-xl bg-zinc-800/50 border border-white/10 p-4 mb-4">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">My Musical Journey</p>
                                    <p className="text-sm text-zinc-300">Featured twice on UK's Classic FM</p>
                                </div>
                                <div className="w-full max-w-sm space-y-2">
                                    {["DreamPlay Pianos", "Piano Lessons", "My Spotify"].map((text) => (
                                        <div
                                            key={text}
                                            className="w-full py-3 px-4 rounded-xl bg-zinc-800/50 border border-white/10 text-sm text-zinc-300 text-left"
                                        >
                                            {text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    )
}
