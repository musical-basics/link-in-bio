"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LinkGroup } from "@/components/link-group"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SocialIcons } from "@/components/social-icons"
import { Share2 } from "lucide-react"
import { SharePageDialog } from "@/components/share-page-dialog"
import { ShareLinkDialog } from "@/components/share-link-dialog"
import { useState } from "react"
import type { Link as LinkType, ProfileData } from "@/lib/data"

interface Group {
    id: string
    name: string
    description: string | null
    order: number
}

interface PublicProfileProps {
    initialLinks: LinkType[]
    initialGroups: Group[]
    profileData: ProfileData
}

export function PublicProfile({ initialLinks, initialGroups, profileData }: PublicProfileProps) {
    const [sharePageOpen, setSharePageOpen] = useState(false)
    const [shareLinkOpen, setShareLinkOpen] = useState(false)
    const [selectedLink, setSelectedLink] = useState<LinkType | null>(null)

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
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-2xl px-6 py-12">
                <div className="mb-8 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => setSharePageOpen(true)} className="rounded-full">
                        <Share2 className="h-5 w-5" />
                    </Button>
                </div>

                {/* Header */}
                <div className="mb-8 flex flex-col items-center text-center">
                    <Avatar className="mb-4 h-28 w-28 border-4 border-primary/20">
                        <AvatarImage
                            src={profileData.imageUrl || "/placeholder.svg"}
                            alt={profileData.name}
                            className="object-cover"
                        />
                        <AvatarFallback>
                            {profileData.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </AvatarFallback>
                    </Avatar>
                    <h1 className="mb-2 text-2xl font-bold text-foreground">{profileData.name}</h1>
                    <p className="text-balance text-muted-foreground">{profileData.bio}</p>
                    <div className="mt-4">
                        <SocialIcons socials={profileData.socials} />
                    </div>
                </div>

                <div className="space-y-8">
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

                {/* Admin Link */}
                <div className="mt-12 text-center">
                    <Link href="/admin">
                        <Button variant="outline" size="sm">
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
