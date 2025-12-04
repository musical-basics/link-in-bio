"use client"

import type { Link as LinkType } from "@/lib/data"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface LinkRowProps {
  link: LinkType
  onEdit?: (link: LinkType) => void
  onDelete?: (link: LinkType) => void
}

export function LinkRow({ link, onEdit, onDelete }: LinkRowProps) {
  const IconComponent = (LucideIcons[link.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
    >
      <button
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <IconComponent className="h-5 w-5" />
      </div>

      {/* Link Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{link.title}</h3>
          <Badge variant="outline" className="text-xs">
            {link.group}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{link.subtitle}</p>
        <p className="text-xs text-muted-foreground/70">{link.url}</p>
      </div>

      {/* Analytics Badge */}
      <Badge variant="secondary" className="shrink-0">
        {link.clicks} Clicks
      </Badge>

      <Button size="icon" variant="ghost" onClick={() => onEdit?.(link)}>
        <Pencil className="h-4 w-4" />
      </Button>

      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete?.(link)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
