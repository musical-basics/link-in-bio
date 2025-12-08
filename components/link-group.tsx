import type { Link as LinkType } from "@/lib/data"
import { LinkButton } from "./link-button"

interface LinkGroupProps {
  title: string
  description?: string
  links: LinkType[]
  onShareLink?: (link: LinkType) => void
}

export function LinkGroup({ title, description, links, onShareLink }: LinkGroupProps) {
  return (
    <div className="space-y-3">
      {/* Center-aligned title like Linktree */}
      <div className="text-center py-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {description && (
          <p className="text-xs text-neutral-400">{description}</p>
        )}
      </div>
      <div className="space-y-2">
        {links.map((link) => (
          <LinkButton key={link.id} link={link} onShare={onShareLink} />
        ))}
      </div>
    </div>
  )
}
