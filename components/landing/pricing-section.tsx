"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight, X } from "lucide-react"
import Link from "next/link"

const plans = [
    {
        name: "Starter",
        price: "$0",
        period: "/ forever",
        description: "Perfect for artists just getting started.",
        features: [
            "Unlimited Links",
            "Basic Analytics",
            "Social Icons",
            "Standard Profile Themes",
            "Mobile Optimized",
            "25MB Image Upload Limit"
        ],
        notIncluded: [
            "Timeline Builder",
            "4K Video Backgrounds",
            "Custom Domain Support",
            "A/B Testing"
        ],
        cta: "Create Free Account",
        highlight: false
    },
    {
        name: "Pro Artist",
        price: "$3",
        period: "/ month",
        description: "For serious performers building a brand.",
        features: [
            "Everything in Starter",
            "Visual Timeline Builder",
            "Cinematic 4K Video Backgrounds",
            "A/B Testing",
            "Advanced Analytics & Insights",
            "Priority Support",
            "Early Access to New Features"
        ],
        notIncluded: [],
        cta: "Start 30-Day Free Trial",
        highlight: true
    }
]

export function PricingSection() {
    return (
        <section className="relative py-32 px-4 bg-zinc-950">
            {/* Section gradient */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-white/[0.04] to-transparent rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4">Pricing</h2>
                    <p className="text-zinc-400 text-lg">Start for free, upgrade when you're ready.</p>
                </motion.div>

                {/* Pricing Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`relative p-8 rounded-3xl border flex flex-col ${plan.highlight
                                ? "border-white/20 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm"
                                : "border-white/5 bg-zinc-900/20"
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-medium text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="font-serif text-5xl font-light text-white">{plan.price}</span>
                                    <span className="text-zinc-500">{plan.period}</span>
                                </div>
                                <p className="text-zinc-400 text-sm">{plan.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? "bg-white/10" : "bg-zinc-800"}`}>
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-zinc-300 text-sm">{feature}</span>
                                    </li>
                                ))}
                                {plan.notIncluded.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 opacity-50">
                                        <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                                            <X className="w-3 h-3 text-zinc-500" />
                                        </div>
                                        <span className="text-zinc-500 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/signup" className="w-full">
                                <Button
                                    size="lg"
                                    variant={plan.highlight ? "default" : "outline"}
                                    className={`w-full py-6 text-lg font-medium rounded-full ${plan.highlight
                                        ? "bg-white text-black hover:bg-zinc-200"
                                        : "border-white/10 text-white hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    {plan.cta}
                                    {plan.highlight && <ArrowRight className="ml-2 h-5 w-5" />}
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
