"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LinkGroup } from "@/components/link-group"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SocialIcons } from "@/components/social-icons"
import { Share2, Sparkles } from "lucide-react"
import { SharePageDialog } from "@/components/share-page-dialog"
import { ShareLinkDialog } from "@/components/share-link-dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Link as LinkType, ProfileData } from "@/lib/data"
import { CinematicHeroCard } from "@/components/cinematic-hero-card"

interface Group {
    id: string
    name: string
    description: string | null
    order: number
}

interface ClassicThemeProps {
    initialLinks: LinkType[]
    initialGroups: Group[]
    profileData: ProfileData
}

export function ClassicTheme({ initialLinks, initialGroups, profileData }: ClassicThemeProps) {
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
        <div className="min-h-screen bg-black">
            {/* Grey card container like Linktree */}
            <div className="mx-auto max-w-xl px-1 sm:px-2 py-2 sm:py-4">
                <div className="rounded-xl sm:rounded-2xl bg-neutral-900 px-3 sm:px-4 py-4 sm:py-6">
                    {/* Top icons */}
                    <div className="mb-6 flex justify-between items-center">
                        <Button variant="ghost" size="icon" className="rounded-full bg-neutral-800 text-white hover:bg-neutral-700">
                            <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setSharePageOpen(true)} className="rounded-full bg-neutral-800 text-white hover:bg-neutral-700">
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Header */}
                    <div className="mb-8 flex flex-col items-center text-center">
                        <Avatar className="mb-4 h-24 w-24 border-2 border-neutral-700">
                            <AvatarImage
                                src={profileData.imageUrl || "/placeholder.svg"}
                                alt={profileData.name}
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-neutral-800 text-white">
                                {profileData.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </AvatarFallback>
                        </Avatar>
                        <h1 className="mb-1 text-2xl font-bold text-white">{profileData.name}</h1>
                        <p className="text-neutral-400">{profileData.bio}</p>
                        <div className="mt-4">
                            <SocialIcons socials={profileData.socials.filter(s => s.isActive !== false)} />
                        </div>
                    </div>

                    {/* Hero Section */}
                    {profileData.showHero && (
                        <div className="mb-6">
                            <CinematicHeroCard
                                headline={profileData.heroHeadline || "My Story"}
                                subtitle={profileData.heroSubtitle || "Welcome to my musical journey."}
                                videoUrl={profileData.heroVideoUrl || undefined}
                                onCtaClick={handleCtaClick}
                            />
                        </div>
                    )}

                    {/* Links */}
                    <div className="space-y-6">
                        {sortedGroupNames.map((groupName) => {
                            const groupInfo = initialGroups.find((g: Group) => g.name === groupName)
                            const links = (groupedLinks[groupName] || []).sort((a, b) => a.order - b.order)
                            return (
                                <LinkGroup
                                    key={groupName}
                                    title={groupName}
                                    description={groupInfo?.description || undefined}
                                    links={links}
                                    onShareLink={handleShareLink}
                                />
                            )
                        })}
                    </div>
                </div>

                {/* Admin Link - outside card */}
                <div className="mt-8 text-center">
                    <Link href="/admin">
                        <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-white hover:bg-neutral-800">
                            Admin Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            <SharePageDialog profile={profileData} open={sharePageOpen} onOpenChange={setSharePageOpen} />
            <ShareLinkDialog link={selectedLink} open={shareLinkOpen} onOpenChange={setShareLinkOpen} />
        </div>
    )
}
