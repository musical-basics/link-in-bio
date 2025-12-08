"use client"

import { useState, useEffect, useMemo } from "react"
import type { Link as LinkType } from "@/lib/data"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface EditLinkSheetProps {
  link: LinkType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedLink: LinkType) => void
  availableGroups: string[]
}

export function EditLinkSheet({ link, open, onOpenChange, onSave, availableGroups }: EditLinkSheetProps) {
  const [title, setTitle] = useState(link?.title || "")
  const [subtitle, setSubtitle] = useState(link?.subtitle || "")
  const [url, setUrl] = useState(link?.url || "")
  const [icon, setIcon] = useState(link?.icon || "Link")
  const [iconSearch, setIconSearch] = useState("")
  const [group, setGroup] = useState(link?.group || "Work")

  // Update form whenever link changes
  useEffect(() => {
    if (link) {
      setTitle(link.title)
      setSubtitle(link.subtitle)
      setUrl(link.url)
      setIcon(link.icon)
      setGroup(link.group)
      setIconSearch("")
    }
  }, [link])

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return COMMON_ICONS
    const search = iconSearch.toLowerCase()
    return COMMON_ICONS.filter((iconName) => iconName.toLowerCase().includes(search))
  }, [iconSearch])

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
  }

  const handleSave = () => {
    if (link) {
      onSave({
        ...link,
        title,
        subtitle,
        url,
        icon,
        group,
      })
      onOpenChange(false)
    }
  }

  const SelectedIconComponent = (LucideIcons[icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Link</SheetTitle>
          <SheetDescription>Update the details of your link. Changes are saved immediately.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Portfolio Website"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="View my latest work"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Icon Picker */}
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
                          onClick={() => setIcon(iconName)}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${icon === iconName
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
                  <span className="text-sm">Selected: {icon}</span>
                </div>
              </TabsContent>
              <TabsContent value="custom">
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  <p>Custom image upload coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group">Group</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger id="group">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableGroups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
