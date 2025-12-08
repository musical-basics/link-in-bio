"use client"

import type { Link as LinkType } from "@/lib/data"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface LinkRowProps {
  link: LinkType
  onEdit?: (link: LinkType) => void
  onDelete?: (link: LinkType) => void
  onToggleActive?: (link: LinkType, isActive: boolean) => void
  sortableId?: string
}

export function LinkRow({ link, onEdit, onDelete, onToggleActive, sortableId }: LinkRowProps) {
  const IconComponent = (LucideIcons[link.icon as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId || link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent ${!link.isActive ? 'opacity-50' : ''}`}
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

      {/* Visibility Toggle */}
      <Switch
        checked={link.isActive}
        onCheckedChange={(checked) => onToggleActive?.(link, checked)}
        aria-label={link.isActive ? 'Hide from public' : 'Show on public'}
      />

      <Button size="icon" variant="ghost" onClick={() => onEdit?.(link)}>
        <Pencil className="h-4 w-4" />
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{link.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete?.(link)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

