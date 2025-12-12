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

import { usePostHog } from 'posthog-js/react'

export function LinkButton({ link, onShare }: LinkButtonProps) {
  const posthog = usePostHog()
  const IconComponent = (LucideIcons[link.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link

  const handleLinkClick = () => {
    posthog.capture('link_clicked', {
      link_id: link.id,
      link_url: link.url,
      link_title: link.title,
      section: 'list'
    })
  }

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onShare?.(link)
  }

  // Featured layout - image on top, title bar below (Linktree style)
  if (link.layout === "featured") {
    return (
      <div className="relative group/container">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          data-link-id={link.id}
          onClick={handleLinkClick}
          className="group block w-full rounded-xl overflow-hidden bg-neutral-800 transition-all hover:scale-[1.01]"
        >
          {link.thumbnail ? (
            <img src={link.thumbnail} alt={link.title} className="w-full aspect-video object-cover" />
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center">
              <IconComponent className="h-16 w-16 text-neutral-500" />
            </div>
          )}
          <div className="px-4 py-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">{link.title}</h3>
            {onShare && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShareClick}
                className="h-8 w-8 opacity-0 transition-opacity group-hover/container:opacity-100 hover:bg-neutral-700 text-neutral-400"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            )}
          </div>
        </a>
      </div>
    )
  }

  // Classic layout - dark card with rounded thumbnail (Linktree style)
  return (
    <div className="relative group/container">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        data-link-id={link.id}
        onClick={handleLinkClick}
        className="group flex w-full items-center gap-3 rounded-lg bg-neutral-800 pl-2 pr-3 py-2 transition-all hover:scale-[1.01] hover:bg-neutral-700"
      >
        {link.thumbnail ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg overflow-hidden">
            <img src={link.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-700 text-neutral-400">
            <IconComponent className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 text-left">
          <h3 className="text-sm font-medium text-white">{link.title}</h3>
        </div>
        <LucideIcons.ChevronRight className="h-5 w-5 text-neutral-500 transition-transform group-hover:translate-x-0.5" />
      </a>
      {onShare && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShareClick}
          className="absolute right-10 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 transition-opacity group-hover/container:opacity-100 hover:bg-neutral-700 text-neutral-400"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
