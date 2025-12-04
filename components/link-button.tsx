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

  return (
    <div className="relative group/container">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        data-link-id={link.id}
        className="group flex w-full items-center gap-4 rounded-2xl bg-card p-4 transition-all hover:scale-[1.02] hover:bg-card/80 hover:shadow-lg hover:shadow-primary/20"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <IconComponent className="h-6 w-6" />
        </div>
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
