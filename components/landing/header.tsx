"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Music2, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                isScrolled
                    ? "bg-zinc-950/80 backdrop-blur-md border-white/10 py-3"
                    : "bg-transparent border-transparent py-5"
            )}
        >
            <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center transition-transform group-hover:scale-105">
                        <Music2 className="w-6 h-6 text-black" />
                    </div>
                    <span className="font-serif text-xl md:text-2xl text-white tracking-tight">Musical.bio</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
                        Features
                    </Link>
                    <Link href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
                        Pricing
                    </Link>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <Link href="/login">
                        <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5">
                            Login
                        </Button>
                    </Link>
                    <Link href="/signup">
                        <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-6">
                            Sign Up
                        </Button>
                    </Link>
                </nav>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden p-2 text-zinc-400 hover:text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 right-0 bg-zinc-900 border-b border-white/10 p-6 md:hidden flex flex-col gap-6"
                    >
                        <Link
                            href="#features"
                            className="text-lg text-zinc-400"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Features
                        </Link>
                        <Link
                            href="#pricing"
                            className="text-lg text-zinc-400"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Pricing
                        </Link>
                        <div className="h-px w-full bg-white/10" />
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full text-zinc-400 py-6 text-lg">
                                Login
                            </Button>
                        </Link>
                        <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full bg-white text-black py-6 text-lg rounded-full">
                                Sign Up
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}
