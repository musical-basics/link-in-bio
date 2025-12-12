"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type Link as LinkType } from "@/lib/data"
import { LinkManager } from "@/components/link-manager"
import { ArrowLeft, User } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateLink, createLink, deleteLink, getLinks } from "@/app/actions/links"
import { getGroups, reorderGroups } from "@/app/actions/groups"
import { getProfile, updateProfile } from "@/app/actions/profile"
import { ManageGroupsDialog } from "@/components/manage-groups-dialog"
import { ManageSocialsDialog } from "@/components/manage-socials-dialog"
import { AddLinkDialog } from "@/components/add-link-dialog"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { HeroSectionDialog } from "@/components/hero-section-dialog"
import { ThemeSelector } from "@/components/theme-selector"
import { Video, Palette, ListMusic, BarChart3 } from "lucide-react"

interface Group {
    id: string
    name: string
    description: string | null
    order: number
}

interface AdminDashboardProps {
    initialLinks: LinkType[]
    initialGroups: Group[]
    username: string
    initialProfile: any | null
}

export function AdminDashboard({ initialLinks, initialGroups, username, initialProfile }: AdminDashboardProps) {
    const [links, setLinks] = useState<LinkType[]>(initialLinks)
    const [groups, setGroups] = useState<Group[]>(initialGroups)
    const [isManageGroupsOpen, setIsManageGroupsOpen] = useState(false)
    const [isManageSocialsOpen, setIsManageSocialsOpen] = useState(false)
    const [isAddLinkOpen, setIsAddLinkOpen] = useState(false)
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
    const [isHeroSectionOpen, setIsHeroSectionOpen] = useState(false)
    const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false)
    const [profile, setProfile] = useState<any>(initialProfile)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        const result = await getProfile()
        if (result.success) {
            setProfile(result.data)
        }
    }

    const refreshGroups = async () => {
        const result = await getGroups()
        if (result.success) {
            setGroups(result.data as Group[])
        }
    }

    const refreshLinks = async () => {
        const result = await getLinks()
        if (result.success) {
            setLinks(result.data as LinkType[])
        }
    }

    const handleUpdateLink = async (updatedLink: LinkType) => {
        // Optimistic update - use functional update to avoid stale closure
        setLinks(prevLinks => prevLinks.map((link) => (link.id === updatedLink.id ? updatedLink : link)))

        // Server update
        const result = await updateLink(updatedLink.id, updatedLink)
        if (!result.success) {
            // Revert on failure (optional, but good practice)
            console.error("Failed to update link")
            // You might want to fetch fresh data here or revert the change
        }
    }

    const handleAddLink = async (linkData: {
        title: string
        subtitle: string
        url: string
        icon: string
        group: string
    }) => {
        const result = await createLink(linkData)
        if (result.success) {
            setLinks([result.data as LinkType, ...links])
        } else {
            console.error("Failed to create link")
        }
    }

    // Get unique groups for the add link dialog
    const existingGroups = [...new Set(links.map((l) => l.group))]

    const handleDeleteLink = async (linkToDelete: LinkType) => {
        // Optimistic update
        setLinks(links.filter((link) => link.id !== linkToDelete.id))

        // Server delete
        const result = await deleteLink(linkToDelete.id)
        if (!result.success) {
            // Revert on failure
            console.error("Failed to delete link")
            setLinks(links) // Restore original links
        }
    }

    const handleToggleActive = async (link: LinkType, isActive: boolean) => {
        const updatedLink = { ...link, isActive }
        // Optimistic update - use functional update
        setLinks(prevLinks => prevLinks.map(l => l.id === link.id ? updatedLink : l))

        // Server update
        const result = await updateLink(link.id, { isActive })
        if (!result.success) {
            console.error("Failed to toggle link visibility")
            // Revert
            setLinks(prevLinks => prevLinks.map(l => l.id === link.id ? link : l))
        }
    }

    const handleUpdateGroups = async (updatedLinks: LinkType[]) => {
        // Find changed links and update them on server
        for (const updatedLink of updatedLinks) {
            const originalLink = links.find((l) => l.id === updatedLink.id)
            if (originalLink && originalLink.group !== updatedLink.group) {
                await updateLink(updatedLink.id, { group: updatedLink.group })
            }
        }
        setLinks(updatedLinks)
    }

    const handleReorderGroups = async (newGroupOrder: string[]) => {
        // Optimistic update - create/update groups with new order
        const updatedGroups = newGroupOrder.map((name, index) => {
            const existing = groups.find(g => g.name === name)
            return existing
                ? { ...existing, order: index + 1 }
                : { id: `temp-${name}`, name, description: null, order: index + 1 }
        })
        setGroups(updatedGroups)

        // Server update
        const groupOrders = newGroupOrder.map((name, index) => ({ name, order: index + 1 }))
        const result = await reorderGroups(groupOrders)
        if (!result.success) {
            console.error("Failed to reorder groups")
            refreshGroups() // Refresh to get correct order
        }
    }

    return (
        <>
            <div className="min-h-screen bg-background">
                <div className="mx-auto max-w-7xl px-6 py-8">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                            <p className="text-muted-foreground">Manage your links and profile</p>
                        </div>
                        <Link href={`/u/${username}`}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Public View
                            </Button>
                        </Link>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Profile Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Profile
                                </CardTitle>
                                <CardDescription>Your public profile information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col items-center text-center">
                                    <Avatar className="mb-3 h-20 w-20 border-2 border-primary/20">
                                        <AvatarImage src={profile?.imageUrl || "/placeholder.svg"} alt={profile?.name || "Profile"} />
                                        <AvatarFallback>
                                            {(profile?.name || "")
                                                .split(" ")
                                                .map((n: string) => n[0])
                                                .join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="font-semibold">{profile?.name || "Your Name"}</h3>
                                    <p className="text-sm text-muted-foreground">{profile?.bio || "Set up your profile"}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full bg-transparent"
                                    onClick={() => setIsEditProfileOpen(true)}
                                >
                                    Edit Profile
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Stats Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Analytics</CardTitle>
                                <CardDescription>Overview of your link performance</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Links</span>
                                    <Badge variant="secondary">{links.length}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Clicks</span>
                                    <Badge variant="secondary">{links.reduce((sum, link) => sum + link.clicks, 0)}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Groups</span>
                                    <Badge variant="secondary">{new Set(links.map((l) => l.group)).size}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Manage your Link in Bio</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button className="w-full bg-transparent" variant="outline" onClick={() => setIsAddLinkOpen(true)}>
                                    Add New Link
                                </Button>
                                <Button className="w-full bg-transparent" variant="outline" onClick={() => setIsManageGroupsOpen(true)}>
                                    Manage Groups
                                </Button>
                                <Button className="w-full bg-transparent" variant="outline" onClick={() => setIsManageSocialsOpen(true)}>
                                    Social Icons
                                </Button>
                                <Button className="w-full bg-transparent" variant="outline" onClick={() => setIsHeroSectionOpen(true)}>
                                    <Video className="mr-2 h-4 w-4" />
                                    Edit Hero Section
                                </Button>
                                <Link href="/admin/timeline-builder">
                                    <Button className="w-full bg-transparent" variant="outline">
                                        <ListMusic className="mr-2 h-4 w-4" />
                                        Timeline Builder
                                    </Button>
                                </Link>
                                <Link href="/admin/analytics">
                                    <Button className="w-full bg-transparent" variant="outline">
                                        <BarChart3 className="mr-2 h-4 w-4" />
                                        View Analytics
                                    </Button>
                                </Link>
                                <Button className="w-full bg-transparent" variant="outline" onClick={() => setIsThemeSelectorOpen(true)}>
                                    <Palette className="mr-2 h-4 w-4" />
                                    Change Theme
                                </Button>
                                <Button className="w-full bg-transparent" variant="outline">
                                    View Analytics
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Link Manager */}
                    <div className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Link Manager</CardTitle>
                                <CardDescription>Drag and drop to reorder links. Click on a link to edit.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <LinkManager links={links} setLinks={setLinks} onUpdateLink={handleUpdateLink} onDeleteLink={handleDeleteLink} onToggleActive={handleToggleActive} availableGroups={[...new Set([...groups.map(g => g.name), ...links.map(l => l.group)])]} groups={groups} onReorderGroups={handleReorderGroups} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div >

            <ManageGroupsDialog
                open={isManageGroupsOpen}
                onOpenChange={setIsManageGroupsOpen}
                links={links}
                groups={groups}
                onUpdateLinks={handleUpdateGroups}
                onRefreshGroups={refreshGroups}
                onRefreshLinks={refreshLinks}
            />

            <AddLinkDialog
                open={isAddLinkOpen}
                onOpenChange={setIsAddLinkOpen}
                onAddLink={handleAddLink}
                existingGroups={[...new Set([...groups.map(g => g.name), ...links.map(l => l.group)])]}
            />

            {
                profile && (
                    <EditProfileDialog
                        open={isEditProfileOpen}
                        onOpenChange={setIsEditProfileOpen}
                        initialData={{
                            name: profile.name,
                            bio: profile.bio,
                            imageUrl: profile.imageUrl,
                            imageObjectFit: profile.imageObjectFit,
                            imageCrop: profile.imageCrop,
                        }}
                        onSuccess={fetchProfile}
                    />
                )
            }

            <ManageSocialsDialog
                open={isManageSocialsOpen}
                onOpenChange={setIsManageSocialsOpen}
                socials={(profile?.socials as any[]) || []}
                onSave={async (socials) => {
                    const result = await updateProfile({ socials })
                    if (result.success) {
                        fetchProfile()
                    }
                }}
            />

            {
                profile && (
                    <HeroSectionDialog
                        open={isHeroSectionOpen}
                        onOpenChange={setIsHeroSectionOpen}
                        initialData={{
                            heroHeadline: profile.heroHeadline,
                            heroSubtitle: profile.heroSubtitle,
                            heroVideoUrl: profile.heroVideoUrl,
                            showHero: profile.showHero,
                        }}
                        onSuccess={fetchProfile}
                        userId={profile.userId}
                    />
                )
            }

            <ThemeSelector
                open={isThemeSelectorOpen}
                onOpenChange={setIsThemeSelectorOpen}
                currentTheme={profile?.theme || "classic"}
                onSuccess={fetchProfile}
            />
        </>
    )
}
