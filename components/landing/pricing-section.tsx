"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

const features = [
    "Unlimited Links",
    "Custom Domain Support",
    "Advanced Analytics",
    "4K Video Backgrounds",
    "Timeline Builder",
    "Priority Support",
]

export function PricingSection() {
    return (
        <section className="relative py-32 px-4 bg-zinc-950">
            {/* Section gradient */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-white/[0.04] to-transparent rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-lg mx-auto">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4">Simple Pricing</h2>
                    <p className="text-zinc-400 text-lg">One plan. Everything included.</p>
                </motion.div>

                {/* Pricing card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="relative p-8 md:p-10 rounded-3xl border border-white/20 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm"
                >
                    {/* Glow */}
                    <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-white/10 to-transparent opacity-50 -z-10" />

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                        <Sparkles className="w-4 h-4 text-white" />
                        <span className="text-sm text-zinc-300">30-day free trial</span>
                    </div>

                    {/* Price */}
                    <div className="mb-8">
                        <div className="flex items-baseline gap-2">
                            <span className="font-serif text-6xl md:text-7xl font-light text-white">$3</span>
                            <span className="text-xl text-zinc-400">/ month</span>
                        </div>
                        <p className="text-zinc-500 mt-2">No credit card required to start.</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                        {features.map((feature) => (
                            <li key={feature} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-zinc-300">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <Link href="/signup">
                        <Button
                            size="lg"
                            className="w-full bg-white text-black hover:bg-zinc-200 py-6 text-lg font-medium rounded-full"
                        >
                            Start Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
