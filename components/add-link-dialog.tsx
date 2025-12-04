"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"

// Common icons to show in the picker
const COMMON_ICONS = [
    "Globe", "Music", "Video", "Youtube", "Twitter", "Instagram",
    "Facebook", "Linkedin", "Github", "Mail", "Phone", "Link",
    "ShoppingCart", "ShoppingBag", "CreditCard", "FileText", "Book", "Newspaper",
    "Camera", "Image", "Mic", "Headphones", "Podcast", "Gift",
    "Cloud", "Send", "MessageCircle", "Heart", "Star", "Users",
    "Home", "MapPin", "Calendar", "Clock", "Briefcase", "Code",
    "Twitch", "Spotify", "Apple", "Chrome", "Coffee", "Gamepad2",
]

interface AddLinkDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAddLink: (link: {
        title: string
        subtitle: string
        url: string
        icon: string
        group: string
    }) => void
    existingGroups: string[]
}

export function AddLinkDialog({
    open,
    onOpenChange,
    onAddLink,
    existingGroups,
}: AddLinkDialogProps) {
    const [title, setTitle] = useState("")
    const [subtitle, setSubtitle] = useState("")
    const [url, setUrl] = useState("")
    const [selectedIcon, setSelectedIcon] = useState("Link")
    const [iconSearch, setIconSearch] = useState("")
    const [group, setGroup] = useState("")
    const [newGroup, setNewGroup] = useState("")
    const [isCreatingGroup, setIsCreatingGroup] = useState(false)

    // Filter icons based on search
    const filteredIcons = useMemo(() => {
        if (!iconSearch.trim()) return COMMON_ICONS
        const search = iconSearch.toLowerCase()
        return COMMON_ICONS.filter((icon) => icon.toLowerCase().includes(search))
    }, [iconSearch])

    const handleSubmit = () => {
        if (!title.trim() || !url.trim()) return

        const finalGroup = isCreatingGroup && newGroup.trim() ? newGroup.trim() : (group || "General")

        onAddLink({
            title: title.trim(),
            subtitle: subtitle.trim(),
            url: url.trim(),
            icon: selectedIcon,
            group: finalGroup,
        })

        // Reset form
        setTitle("")
        setSubtitle("")
        setUrl("")
        setSelectedIcon("Link")
        setIconSearch("")
        setGroup("")
        setNewGroup("")
        setIsCreatingGroup(false)
        onOpenChange(false)
    }

    const handleCancel = () => {
        setTitle("")
        setSubtitle("")
        setUrl("")
        setSelectedIcon("Link")
        setIconSearch("")
        setGroup("")
        setNewGroup("")
        setIsCreatingGroup(false)
        onOpenChange(false)
    }

    const SelectedIconComponent = (LucideIcons[selectedIcon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Link</DialogTitle>
                    <DialogDescription>
                        Create a new link to add to your Link in Bio.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="My Awesome Link"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Subtitle */}
                    <div className="space-y-2">
                        <Label htmlFor="subtitle">Subtitle (optional)</Label>
                        <Input
                            id="subtitle"
                            placeholder="A short description"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                        />
                    </div>

                    {/* URL */}
                    <div className="space-y-2">
                        <Label htmlFor="url">URL</Label>
                        <Input
                            id="url"
                            placeholder="https://example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    </div>

                    {/* Icon */}
                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <Tabs defaultValue="lucide" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="lucide">Lucide Icons</TabsTrigger>
                                <TabsTrigger value="custom">Custom Image</TabsTrigger>
                            </TabsList>
                            <TabsContent value="lucide" className="space-y-3">
                                <Input
                                    placeholder="Search icons..."
                                    value={iconSearch}
                                    onChange={(e) => setIconSearch(e.target.value)}
                                />
                                <ScrollArea className="h-48 rounded-md border p-2">
                                    <div className="grid grid-cols-6 gap-2">
                                        {filteredIcons.map((iconName) => {
                                            const IconComp = LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcon
                                            if (!IconComp) return null
                                            return (
                                                <button
                                                    key={iconName}
                                                    type="button"
                                                    onClick={() => setSelectedIcon(iconName)}
                                                    className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${selectedIcon === iconName
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "hover:bg-accent"
                                                        }`}
                                                >
                                                    <IconComp className="h-5 w-5" />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                                <div className="flex items-center gap-2 rounded-lg border p-2">
                                    <SelectedIconComponent className="h-5 w-5 text-primary" />
                                    <span className="text-sm">Selected: {selectedIcon}</span>
                                </div>
                            </TabsContent>
                            <TabsContent value="custom">
                                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                    <p>Custom image upload coming soon</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Group */}
                    <div className="space-y-2">
                        <Label>Group</Label>
                        {isCreatingGroup ? (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="New group name..."
                                    value={newGroup}
                                    onChange={(e) => setNewGroup(e.target.value)}
                                    autoFocus
                                />
                                <Button variant="outline" onClick={() => setIsCreatingGroup(false)}>
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Select value={group} onValueChange={setGroup}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select a group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {existingGroups.map((g) => (
                                            <SelectItem key={g} value={g}>
                                                {g}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" onClick={() => setIsCreatingGroup(true)}>
                                    New
                                </Button>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Group similar links together (e.g., Music, Socials, Products)
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!title.trim() || !url.trim()}>
                        Add Link
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
