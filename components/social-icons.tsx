"use client"

import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface SocialIconsProps {
  socials: {
    icon: string
    url: string
    label: string
  }[]
}

export function SocialIcons({ socials }: SocialIconsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {socials.map((social) => {
        const IconComponent = (LucideIcons[social.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link

        return (
          <a
            key={social.label}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-foreground transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground"
          >
            <IconComponent className="h-5 w-5" />
          </a>
        )
      })}
    </div>
  )
}
