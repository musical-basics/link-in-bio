"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Image as ImageIcon, Video, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TimelineEvent } from "@prisma/client"
import { cn } from "@/lib/utils"

interface EventCardProps {
    event: TimelineEvent
    onEdit: (event: TimelineEvent) => void
    onDelete: (id: string) => void
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: event.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-900",
                isDragging && "opacity-50 ring-2 ring-white/20"
            )}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
            >
                <GripVertical className="h-5 w-5" />
            </div>

            {/* Thumbnail */}
            <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-950 border border-zinc-800">
                {event.mediaUrl ? (
                    event.mediaType === "video" ? (
                        <video src={event.mediaUrl} className="h-full w-full object-cover" muted />
                    ) : (
                        <img src={event.mediaUrl} alt={event.title} className="h-full w-full object-cover" />
                    )
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        {event.mediaType === "video" ? <Video className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white truncate">{event.title}</h3>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                        {event.year}
                    </span>
                </div>
                <p className="text-sm text-zinc-500 truncate">{event.description || "No description"}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(event)}
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(event.id)}
                    className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-900/20"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
