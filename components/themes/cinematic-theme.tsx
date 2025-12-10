"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LinkGroup } from "@/components/link-group"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SocialIcons } from "@/components/social-icons"
import { Share2, ArrowRight } from "lucide-react"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { SharePageDialog } from "@/components/share-page-dialog"
import { ShareLinkDialog } from "@/components/share-link-dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Link as LinkType, ProfileData } from "@/lib/data"

interface Group {
    id: string
    name: string
    description: string | null
    order: number
}

interface CinematicThemeProps {
    initialLinks: LinkType[]
    initialGroups: Group[]
    profileData: ProfileData
}

export function CinematicTheme({ initialLinks, initialGroups, profileData }: CinematicThemeProps) {
    const router = useRouter()
    const [sharePageOpen, setSharePageOpen] = useState(false)
    const [shareLinkOpen, setShareLinkOpen] = useState(false)
    const [selectedLink, setSelectedLink] = useState<LinkType | null>(null)

    const handleCtaClick = () => {
        router.push(`/${profileData.username}/story`)
    }

    const handleShareLink = (link: LinkType) => {
        setSelectedLink(link)
        setShareLinkOpen(true)
    }

    // Filter active links and group by category
    const activeLinks = initialLinks.filter(link => link.isActive !== false)
    const groupedLinks = activeLinks.reduce(
        (acc, link) => {
            if (!acc[link.group]) {
                acc[link.group] = []
            }
            acc[link.group].push(link)
            return acc
        },
        {} as Record<string, LinkType[]>,
    )

    // Sort groups by order (from DB groups first, then any remaining)
    const sortedGroupNames = [...new Set([
        ...initialGroups.sort((a, b) => a.order - b.order).map(g => g.name),
        ...Object.keys(groupedLinks)
    ])].filter(name => groupedLinks[name]?.length > 0)

    return (
        <div className="cinematic-theme min-h-screen bg-black bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.03),transparent)]">
            {/* Main content container */}
            <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
                {/* Share button - floating top right */}
                <div className="flex justify-end mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSharePageOpen(true)}
                        className="rounded-full bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200"
                    >
                        <Share2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Hero Section - Serif headlines, centered */}
                <div className="mb-16 flex flex-col items-center text-center">
                    <Avatar className="mb-8 h-28 w-28 border border-white/10 ring-1 ring-white/5 ring-offset-4 ring-offset-black">
                        <AvatarImage
                            src={profileData.imageUrl || "/placeholder.svg"}
                            alt={profileData.name}
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-zinc-900/50 text-white font-serif text-2xl">
                            {profileData.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </AvatarFallback>
                    </Avatar>

                    {/* Serif Headline */}
                    <h1 className="mb-3 font-serif text-4xl md:text-5xl text-white tracking-tight">
                        {profileData.name}
                    </h1>

                    {/* Subheadline */}
                    <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
                        {profileData.bio}
                    </p>

                    {/* Social Icons */}
                    <div className="mt-6">
                        <SocialIcons socials={profileData.socials.filter(s => s.isActive !== false)} />
                    </div>
                </div>

                {/* Hero Card - Glassmorphism */}
                {profileData.showHero && (
                    <div className="mb-12">
                        <div
                            className="relative overflow-hidden rounded-2xl bg-zinc-900/30 backdrop-blur-xl border border-white/[0.08] p-8 transition-all duration-300 hover:bg-zinc-800/40 hover:border-white/[0.12] cursor-pointer group"
                            onClick={handleCtaClick}
                        >
                            {/* Video background if available */}
                            {profileData.heroVideoUrl && (
                                <div className="absolute inset-0 z-0">
                                    <video
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="w-full h-full object-cover opacity-20"
                                        src={profileData.heroVideoUrl}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
                                </div>
                            )}

                            <div className="relative z-10">
                                <h2 className="font-serif text-2xl md:text-3xl text-white mb-3 tracking-tight">
                                    {profileData.heroHeadline || "My Story"}
                                </h2>
                                <p className="text-zinc-400 mb-6 max-w-lg">
                                    {profileData.heroSubtitle || "Welcome to my musical journey."}
                                </p>
                                <div className="flex items-center gap-2 text-white text-sm font-medium group-hover:gap-3 transition-all duration-300">
                                    <span>View Timeline</span>
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </div>

                            {/* Inner glow effect on hover */}
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
                                boxShadow: '0 0 30px rgba(255,255,255,0.03), 0 0 60px rgba(255,255,255,0.02)'
                            }} />
                        </div>
                    </div>
                )}

                {/* Links Section - Glass cards */}
                <div className="space-y-8">
                    {sortedGroupNames.map((groupName) => {
                        const groupInfo = initialGroups.find((g: Group) => g.name === groupName)
                        const links = (groupedLinks[groupName] || []).sort((a, b) => a.order - b.order)

                        return (
                            <div key={groupName} className="space-y-4">
                                {/* Group Header */}
                                <div className="flex items-center gap-4">
                                    <h3 className="font-serif text-xl text-white/80">{groupName}</h3>
                                    <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                                </div>

                                {groupInfo?.description && (
                                    <p className="text-zinc-500 text-sm -mt-2">{groupInfo.description}</p>
                                )}

                                {/* Links Grid */}
                                <div className="space-y-3">
                                    {links.map((link) => {
                                        const IconComponent = (LucideIcons[link.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link

                                        return (
                                            <a
                                                key={link.id}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center gap-4 relative overflow-hidden rounded-xl bg-zinc-900/30 backdrop-blur-xl border border-white/[0.08] p-4 transition-all duration-300 hover:bg-zinc-800/40 hover:border-white/[0.12] hover:scale-[1.02]"
                                            >
                                                {/* Thumbnail or Icon */}
                                                {link.thumbnail ? (
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-white/10">
                                                        <img src={link.thumbnail} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-zinc-400 group-hover:text-white transition-colors">
                                                        <IconComponent className="h-5 w-5" />
                                                    </div>
                                                )}

                                                {/* Text content */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white font-medium group-hover:text-white/90 transition-colors truncate">
                                                        {link.title}
                                                    </h4>
                                                    {link.subtitle && (
                                                        <p className="text-zinc-500 text-sm mt-0.5 truncate">{link.subtitle}</p>
                                                    )}
                                                </div>

                                                {/* Arrow */}
                                                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Admin Link */}
                <div className="mt-16 text-center">
                    <Link href="/admin">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-600 hover:text-zinc-400 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-200"
                        >
                            Admin Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            <SharePageDialog profile={profileData} open={sharePageOpen} onOpenChange={setSharePageOpen} />
            <ShareLinkDialog link={selectedLink} open={shareLinkOpen} onOpenChange={setShareLinkOpen} />

            {/* Global styles for this theme */}
            <style jsx global>{`
                .cinematic-theme .font-serif {
                    font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
                }
            `}</style>
        </div>
    )
}
