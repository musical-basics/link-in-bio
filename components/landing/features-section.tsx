"use client"

import { motion } from "framer-motion"
import { Clock, Film, BarChart3 } from "lucide-react"

const features = [
    {
        icon: Clock,
        title: "The Visual Timeline",
        description:
            "Linktree lists links. We tell stories. Showcase your concerts, releases, and milestones in a beautiful, scrolling timeline.",
        highlight: "The USP",
    },
    {
        icon: Film,
        title: "Cinematic Immersion",
        description: "First impressions matter. Use 4K YouTube videos as your background to instantly captivate fans.",
        highlight: null,
    },
    {
        icon: BarChart3,
        title: "Musician-First Analytics",
        description: "Privacy-focused stats that tell you exactly which links are driving your fanbase.",
        highlight: null,
    },
]

export function FeaturesSection() {
    return (
        <section className="relative py-32 px-4 bg-zinc-950">
            {/* Section gradient */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-radial from-white/[0.03] to-transparent rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4">
                        Why Musicians Choose Us
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                        Built specifically for artists who want more than a list of links.
                    </p>
                </motion.div>

                {/* Features grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group relative p-8 rounded-2xl border border-white/10 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors"
                        >
                            {feature.highlight && (
                                <span className="absolute top-4 right-4 text-xs text-zinc-500 uppercase tracking-wider">
                                    {feature.highlight}
                                </span>
                            )}

                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>

                            <h3 className="font-serif text-2xl font-light mb-3 text-white">{feature.title}</h3>

                            <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
