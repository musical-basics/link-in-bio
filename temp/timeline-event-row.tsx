"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2, ImageIcon, Video } from "lucide-react"
import type { TimelineEvent } from "@/lib/timeline-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TimelineEventRowProps {
  event: TimelineEvent
  onEdit: (event: TimelineEvent) => void
  onDelete: (eventId: string) => void
}

export function TimelineEventRow({ event, onEdit, onDelete }: TimelineEventRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 rounded-lg border border-white/10 bg-zinc-900/50 p-4 transition-all ${
        isDragging ? "z-50 scale-[1.02] border-white/20 bg-zinc-800/80 shadow-2xl" : "hover:border-white/20"
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-zinc-600 transition-colors hover:text-white active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Thumbnail */}
      <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border border-white/10">
        {event.media.type === "image" ? (
          <img
            src={event.media.url || "/placeholder.svg?height=64&width=96&query=timeline event"}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <video src={event.media.url} className="h-full w-full object-cover" muted />
        )}
        <div className="absolute bottom-1 right-1">
          {event.media.type === "image" ? (
            <ImageIcon className="h-3 w-3 text-white/70" />
          ) : (
            <Video className="h-3 w-3 text-white/70" />
          )}
        </div>
      </div>

      {/* Event Info */}
      <div className="flex-grow">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-white">{event.title}</h3>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">
            {event.year}
          </Badge>
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{event.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:bg-white/10 hover:text-white"
          onClick={() => onEdit(event)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
          onClick={() => onDelete(event.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
