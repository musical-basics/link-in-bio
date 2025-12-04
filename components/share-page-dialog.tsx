"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Copy, Facebook, MessageCircle, Twitter } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ProfileData } from "@/lib/data"

interface SharePageDialogProps {
  profile: ProfileData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SharePageDialog({ profile, open, onOpenChange }: SharePageDialogProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOptions = [
    {
      name: "Copy Link",
      icon: Copy,
      action: handleCopy,
    },
    {
      name: "X",
      icon: Twitter,
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, "_blank"),
    },
    {
      name: "Facebook",
      icon: Facebook,
      action: () =>
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank"),
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, "_blank"),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Page</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Profile Preview */}
          <div className="rounded-xl bg-muted p-6 text-center">
            <Avatar className="mx-auto mb-3 h-20 w-20 border-4 border-background">
              <AvatarImage src={profile.imageUrl || "/placeholder.svg"} alt={profile.name} />
              <AvatarFallback>
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-bold">{profile.name}</h3>
            <p className="text-sm text-muted-foreground">{shareUrl.replace("https://", "").replace("http://", "")}</p>
          </div>

          {/* Share Options */}
          <div className="grid grid-cols-4 gap-3">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={option.action}
                className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-muted"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
                  <option.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">
                  {copied && option.name === "Copy Link" ? "Copied!" : option.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
