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

import { usePostHog } from 'posthog-js/react'

// ...

export function SocialIcons({ socials }: SocialIconsProps) {
  const posthog = usePostHog()

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
            onClick={() => {
              posthog.capture('link_clicked', {
                link_id: 'social',
                link_url: social.url,
                link_title: social.label,
                section: 'header' // or 'hero' depending on placement, but 'header' implies top/socials
              })
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-foreground transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground"
          >
            <IconComponent className="h-5 w-5" />
          </a>
        )
      })}
    </div>
  )
}
