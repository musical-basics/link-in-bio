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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// Predefined social platforms with their icons and URL templates
const SOCIAL_PLATFORMS = [
    { id: "instagram", name: "Instagram", icon: "Instagram", urlPrefix: "https://instagram.com/", inputType: "username", placeholder: "username" },
    { id: "youtube", name: "YouTube", icon: "Youtube", urlPrefix: "https://youtube.com/@", inputType: "username", placeholder: "channel" },
    { id: "twitch", name: "Twitch", icon: "Twitch", urlPrefix: "https://twitch.tv/", inputType: "username", placeholder: "username" },
    { id: "tiktok", name: "TikTok", icon: "Clapperboard", urlPrefix: "https://tiktok.com/@", inputType: "username", placeholder: "username" },
    { id: "spotify", name: "Spotify", icon: "Music2", urlPrefix: "", inputType: "url", placeholder: "https://open.spotify.com/artist/..." },
    { id: "linkedin", name: "LinkedIn", icon: "Linkedin", urlPrefix: "https://linkedin.com/in/", inputType: "username", placeholder: "username" },
    { id: "discord", name: "Discord", icon: "MessageCircle", urlPrefix: "https://discord.gg/", inputType: "username", placeholder: "invite-code" },
    { id: "applemusic", name: "Apple Music", icon: "Headphones", urlPrefix: "", inputType: "url", placeholder: "https://music.apple.com/..." },
    { id: "snapchat", name: "Snapchat", icon: "Ghost", urlPrefix: "https://snapchat.com/add/", inputType: "username", placeholder: "username" },
    { id: "whatsapp", name: "WhatsApp", icon: "MessageSquare", urlPrefix: "https://wa.me/", inputType: "phone", placeholder: "1234567890" },
    { id: "twitter", name: "X (Twitter)", icon: "Twitter", urlPrefix: "https://twitter.com/", inputType: "username", placeholder: "username" },
    { id: "facebook", name: "Facebook", icon: "Facebook", urlPrefix: "https://facebook.com/", inputType: "username", placeholder: "username" },
    { id: "email", name: "Email", icon: "Mail", urlPrefix: "mailto:", inputType: "email", placeholder: "your@email.com" },
    { id: "payment", name: "Payment", icon: "CreditCard", urlPrefix: "https://paypal.me/", inputType: "username", placeholder: "username" },
]

interface Social {
    icon: string
    url: string
    label: string
    isActive?: boolean
    platformId?: string // Track which platform this is for
}

interface ManageSocialsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    socials: Social[]
    onSave: (socials: Social[]) => void
}

// Sortable item component for drag and drop
function SortableSocialItem({
    id,
    social,
    IconComp,
    onEdit,
    onToggleActive,
}: {
    id: string
    social: Social
    IconComp: LucideIcon
    onEdit: () => void
    onToggleActive: (checked: boolean) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <button className="cursor-grab text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
                <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <IconComp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
                <p className="font-medium">{social.label}</p>
                {social.url && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{social.url}</p>
                )}
            </div>
            <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
            </Button>
            <Switch
                checked={social.isActive !== false}
                onCheckedChange={onToggleActive}
            />
        </div>
    )
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
    const [editValue, setEditValue] = useState("") // Username or full URL depending on platform
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
            platformId: platform.id,
        }
        setCurrentSocials([...currentSocials, newSocial])
        setEditingIndex(currentSocials.length)
        setEditValue("")
        setView("edit")
    }

    const handleEditSocial = (index: number) => {
        setEditingIndex(index)
        const social = currentSocials[index]
        const platform = SOCIAL_PLATFORMS.find(p => p.id === social.platformId || p.icon === social.icon)
        // Extract username from URL if it has a prefix
        if (platform?.urlPrefix && social.url.startsWith(platform.urlPrefix)) {
            setEditValue(social.url.replace(platform.urlPrefix, ""))
        } else {
            setEditValue(social.url)
        }
        setView("edit")
    }

    const handleSaveEdit = () => {
        if (editingIndex !== null) {
            const social = currentSocials[editingIndex]
            const platform = SOCIAL_PLATFORMS.find(p => p.id === social.platformId || p.icon === social.icon)
            // Build full URL from prefix + value
            const fullUrl = platform?.urlPrefix && platform.inputType !== "url"
                ? platform.urlPrefix + editValue
                : editValue
            const updated = [...currentSocials]
            updated[editingIndex] = { ...updated[editingIndex], url: fullUrl }
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

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = currentSocials.findIndex((_, i) => `social-${i}` === active.id)
            const newIndex = currentSocials.findIndex((_, i) => `social-${i}` === over.id)
            setCurrentSocials(arrayMove(currentSocials, oldIndex, newIndex))
        }
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
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={currentSocials.map((_, i) => `social-${i}`)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {currentSocials.map((social, index) => {
                                                const IconComp = (LucideIcons[social.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link
                                                return (
                                                    <SortableSocialItem
                                                        key={`social-${index}`}
                                                        id={`social-${index}`}
                                                        social={social}
                                                        IconComp={IconComp}
                                                        onEdit={() => handleEditSocial(index)}
                                                        onToggleActive={(checked) => handleToggleActive(index, checked)}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </SortableContext>
                                </DndContext>
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
                            {(() => {
                                const social = currentSocials[editingIndex]
                                const platform = SOCIAL_PLATFORMS.find(p => p.id === social?.platformId || p.icon === social?.icon)
                                const labelText = platform?.inputType === "username" ? "Username"
                                    : platform?.inputType === "email" ? "Email"
                                        : platform?.inputType === "phone" ? "Phone Number"
                                            : "URL"
                                return (
                                    <div className="space-y-2">
                                        <Label htmlFor="social-input">{labelText}</Label>
                                        {platform?.urlPrefix && platform.inputType !== "url" && (
                                            <p className="text-xs text-muted-foreground">{platform.urlPrefix}</p>
                                        )}
                                        <Input
                                            id="social-input"
                                            placeholder={platform?.placeholder || "..."}
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                        />
                                    </div>
                                )
                            })()}

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
