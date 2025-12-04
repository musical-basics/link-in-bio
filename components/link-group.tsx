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
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground/70">{description}</p>
        )}
      </div>
      <div className="space-y-3">
        {links.map((link) => (
          <LinkButton key={link.id} link={link} onShare={onShareLink} />
        ))}
      </div>
    </div>
  )
}

