"use client"

import type React from "react"

import type { Link as LinkType } from "@/lib/data"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LinkButtonProps {
  link: LinkType
  onShare?: (link: LinkType) => void
}

export function LinkButton({ link, onShare }: LinkButtonProps) {
  const IconComponent = (LucideIcons[link.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onShare?.(link)
  }

  // Featured layout - large hero image with title overlay
  if (link.layout === "featured") {
    return (
      <div className="relative group/container">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          data-link-id={link.id}
          className="group block w-full rounded-2xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20"
        >
          {link.thumbnail ? (
            <div className="relative aspect-video">
              <img src={link.thumbnail} alt={link.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-semibold text-white text-lg">{link.title}</h3>
                {link.subtitle && <p className="text-sm text-white/80">{link.subtitle}</p>}
              </div>
            </div>
          ) : (
            <div className="relative aspect-video bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <IconComponent className="h-16 w-16 text-primary/50" />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <h3 className="font-semibold text-white text-lg">{link.title}</h3>
                {link.subtitle && <p className="text-sm text-white/80">{link.subtitle}</p>}
              </div>
            </div>
          )}
        </a>
        {onShare && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShareClick}
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover/container:opacity-100 hover:bg-white/20 text-white"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  // Classic layout - compact with icon
  return (
    <div className="relative group/container">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        data-link-id={link.id}
        className="group flex w-full items-center gap-4 rounded-2xl bg-card p-4 transition-all hover:scale-[1.02] hover:bg-card/80 hover:shadow-lg hover:shadow-primary/20"
      >
        {link.thumbnail ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden">
            <img src={link.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <IconComponent className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-foreground">{link.title}</h3>
          <p className="text-sm text-muted-foreground">{link.subtitle}</p>
        </div>
        <LucideIcons.ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </a>
      {onShare && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShareClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/container:opacity-100 hover:bg-muted"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
