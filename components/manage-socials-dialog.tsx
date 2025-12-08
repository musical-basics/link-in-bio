"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, GripVertical, Pencil, Trash2, ChevronLeft, Search } from "lucide-react"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Predefined social platforms with their icons and URL templates
const SOCIAL_PLATFORMS = [
    { id: "instagram", name: "Instagram", icon: "Instagram", placeholder: "https://instagram.com/username" },
    { id: "youtube", name: "YouTube", icon: "Youtube", placeholder: "https://youtube.com/@channel" },
    { id: "twitch", name: "Twitch", icon: "Twitch", placeholder: "https://twitch.tv/username" },
    { id: "tiktok", name: "Music", icon: "Music", placeholder: "https://tiktok.com/@username" }, // TikTok uses Music icon
    { id: "spotify", name: "Spotify", icon: "Music2", placeholder: "https://open.spotify.com/artist/..." },
    { id: "linkedin", name: "LinkedIn", icon: "Linkedin", placeholder: "https://linkedin.com/in/username" },
    { id: "discord", name: "Discord", icon: "MessageCircle", placeholder: "https://discord.gg/invite" },
    { id: "applemusic", name: "Apple Music", icon: "Headphones", placeholder: "https://music.apple.com/..." },
    { id: "snapchat", name: "Snapchat", icon: "Ghost", placeholder: "https://snapchat.com/add/username" },
    { id: "whatsapp", name: "WhatsApp", icon: "MessageSquare", placeholder: "https://wa.me/1234567890" },
    { id: "twitter", name: "X (Twitter)", icon: "Twitter", placeholder: "https://twitter.com/username" },
    { id: "facebook", name: "Facebook", icon: "Facebook", placeholder: "https://facebook.com/username" },
    { id: "email", name: "Email", icon: "Mail", placeholder: "mailto:your@email.com" },
    { id: "payment", name: "Payment", icon: "CreditCard", placeholder: "https://paypal.me/username" },
]

interface Social {
    icon: string
    url: string
    label: string
    isActive?: boolean
}

interface ManageSocialsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    socials: Social[]
    onSave: (socials: Social[]) => void
}

export function ManageSocialsDialog({
    open,
    onOpenChange,
    socials,
    onSave,
}: ManageSocialsDialogProps) {
    const [currentSocials, setCurrentSocials] = useState<Social[]>(socials)
    const [view, setView] = useState<"list" | "add" | "edit">("list")
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editUrl, setEditUrl] = useState("")
    const [searchTerm, setSearchTerm] = useState("")

    // Sync with props when dialog opens
    useEffect(() => {
        if (open) {
            setCurrentSocials(socials)
            setView("list")
            setSearchTerm("")
        }
    }, [open, socials])

    const handleAddSocial = (platform: typeof SOCIAL_PLATFORMS[0]) => {
        const newSocial: Social = {
            icon: platform.icon,
            label: platform.name,
            url: "",
            isActive: true,
        }
        setCurrentSocials([...currentSocials, newSocial])
        setEditingIndex(currentSocials.length)
        setEditUrl("")
        setView("edit")
    }

    const handleEditSocial = (index: number) => {
        setEditingIndex(index)
        setEditUrl(currentSocials[index].url)
        setView("edit")
    }

    const handleSaveEdit = () => {
        if (editingIndex !== null) {
            const updated = [...currentSocials]
            updated[editingIndex] = { ...updated[editingIndex], url: editUrl }
            setCurrentSocials(updated)
            setView("list")
            setEditingIndex(null)
        }
    }

    const handleToggleActive = (index: number, isActive: boolean) => {
        const updated = [...currentSocials]
        updated[index] = { ...updated[index], isActive }
        setCurrentSocials(updated)
    }

    const handleDeleteSocial = (index: number) => {
        setCurrentSocials(currentSocials.filter((_, i) => i !== index))
    }

    const handleSaveAll = () => {
        onSave(currentSocials)
        onOpenChange(false)
    }

    const filteredPlatforms = SOCIAL_PLATFORMS.filter(
        (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Find which platforms are already added
    const addedPlatformIcons = currentSocials.map(s => s.icon)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                {view === "list" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Social Icons</DialogTitle>
                            <DialogDescription>
                                Show visitors where to find you. Add your social profiles, email and more.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            {currentSocials.length > 0 ? (
                                <div className="space-y-2">
                                    {currentSocials.map((social, index) => {
                                        const IconComp = (LucideIcons[social.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link
                                        return (
                                            <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                                    <IconComp className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{social.label}</p>
                                                    {social.url && (
                                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{social.url}</p>
                                                    )}
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditSocial(index)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Switch
                                                    checked={social.isActive !== false}
                                                    onCheckedChange={(checked) => handleToggleActive(index, checked)}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No social icons added yet. Click "Add Social Icon" to get started.
                                </div>
                            )}

                            <Button onClick={() => setView("add")} className="w-full" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Social Icon
                            </Button>

                            <div className="flex gap-3 pt-4 border-t">
                                <Button onClick={handleSaveAll} className="flex-1">
                                    Save Changes
                                </Button>
                                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {view === "add" && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => setView("list")}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <DialogTitle>Add Social Icon</DialogTitle>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <ScrollArea className="h-[300px]">
                                <div className="space-y-1">
                                    {filteredPlatforms.map((platform) => {
                                        const IconComp = (LucideIcons[platform.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link
                                        const isAdded = addedPlatformIcons.includes(platform.icon)

                                        return (
                                            <button
                                                key={platform.id}
                                                onClick={() => !isAdded && handleAddSocial(platform)}
                                                disabled={isAdded}
                                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isAdded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent cursor-pointer'
                                                    }`}
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                                    <IconComp className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="flex-1 text-left">{platform.name}</span>
                                                {isAdded && <span className="text-xs text-muted-foreground">Added</span>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                    </>
                )}

                {view === "edit" && editingIndex !== null && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => setView("list")}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <DialogTitle>Edit {currentSocials[editingIndex]?.label}</DialogTitle>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="social-url">URL</Label>
                                <Input
                                    id="social-url"
                                    placeholder={SOCIAL_PLATFORMS.find(p => p.icon === currentSocials[editingIndex]?.icon)?.placeholder || "https://..."}
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={handleSaveEdit} className="flex-1">
                                    Save
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        handleDeleteSocial(editingIndex)
                                        setView("list")
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
