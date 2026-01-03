"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Music2 } from "lucide-react"

const links = [
    { label: "Login", href: "/login" },
    { label: "Create Account", href: "/signup" },
    { label: "Support", href: "/support" },
]

export function Footer() {
    return (
        <footer className="relative py-16 px-4 border-t border-white/10 bg-zinc-950">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-8"
                >
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                            <Music2 className="w-5 h-5 text-black" />
                        </div>
                        <span className="font-serif text-xl text-white">Musical.bio</span>
                    </div>

                    {/* Links */}
                    <nav className="flex items-center gap-8">
                        {links.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-zinc-400 hover:text-white transition-colors text-sm"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Copyright */}
                    <p className="text-zinc-600 text-sm">© 2026 Musical.bio</p>
                </motion.div>
            </div>
        </footer>
    )
}
