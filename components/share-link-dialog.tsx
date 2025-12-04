"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Copy, Facebook, MessageCircle, Twitter } from "lucide-react"
import type { Link } from "@/lib/data"

interface ShareLinkDialogProps {
  link: Link | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareLinkDialog({ link, open, onOpenChange }: ShareLinkDialogProps) {
  const [copied, setCopied] = useState(false)

  if (!link) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link.url)
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
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(link.url)}`, "_blank"),
    },
    {
      name: "Facebook",
      icon: Facebook,
      action: () =>
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link.url)}`, "_blank"),
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(link.url)}`, "_blank"),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Link Info */}
          <div className="rounded-xl bg-muted p-4">
            <h3 className="mb-1 font-semibold">{link.title}</h3>
            <p className="truncate text-sm text-muted-foreground">{link.url}</p>
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
