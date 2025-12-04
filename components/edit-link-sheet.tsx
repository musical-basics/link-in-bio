"use client"

import { useState } from "react"
import type { Link as LinkType } from "@/lib/data"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditLinkSheetProps {
  link: LinkType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedLink: LinkType) => void
}

export function EditLinkSheet({ link, open, onOpenChange, onSave }: EditLinkSheetProps) {
  const [title, setTitle] = useState(link?.title || "")
  const [subtitle, setSubtitle] = useState(link?.subtitle || "")
  const [url, setUrl] = useState(link?.url || "")
  const [icon, setIcon] = useState(link?.icon || "Link")
  const [group, setGroup] = useState(link?.group || "Work")

  // Update form when link changes
  const handleOpenChange = (open: boolean) => {
    if (open && link) {
      setTitle(link.title)
      setSubtitle(link.subtitle)
      setUrl(link.url)
      setIcon(link.icon)
      setGroup(link.group)
    }
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

          <div className="space-y-2">
            <Label htmlFor="icon">Icon Name</Label>
            <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Globe" />
            <p className="text-xs text-muted-foreground">
              Use any Lucide icon name (e.g., Globe, Music, Twitter, Instagram)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group">Group</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger id="group">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Socials">Socials</SelectItem>
                <SelectItem value="Music">Music</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
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
