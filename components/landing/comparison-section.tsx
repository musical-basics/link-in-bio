"use client"

import { motion } from "framer-motion"
import { X, Check } from "lucide-react"

const themFeatures = [
    "Generic flat list of buttons",
    "Static profile image",
    "Basic link tracking",
    "One-size-fits-all design",
]

const usFeatures = [
    "Immersive visual timeline",
    "4K video backgrounds",
    "Musician-focused analytics",
    "Purpose-built for artists",
]

export function ComparisonSection() {
    return (
        <section className="relative py-32 px-4 bg-zinc-950">
            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4">The Difference</h2>
                    <p className="text-zinc-400 text-lg max-w-xl mx-auto">See why artists are making the switch.</p>
                </motion.div>

                {/* Comparison cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Them */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="p-8 rounded-2xl border border-white/10 bg-zinc-900/20"
                    >
                        <div className="text-sm text-zinc-500 uppercase tracking-wider mb-6">Them</div>

                        <ul className="space-y-4">
                            {themFeatures.map((feature) => (
                                <li key={feature} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <X className="w-3 h-3 text-zinc-500" />
                                    </div>
                                    <span className="text-zinc-400">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Us */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="p-8 rounded-2xl border border-white/20 bg-gradient-to-b from-zinc-900/50 to-zinc-900/30"
                    >
                        <div className="text-sm text-white uppercase tracking-wider mb-6">Musical.bio</div>

                        <ul className="space-y-4">
                            {usFeatures.map((feature) => (
                                <li key={feature} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check className="w-3 h-3 text-black" />
                                    </div>
                                    <span className="text-white">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
