"use client"

import { useState } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { EventCard } from "./event-card"
import { EventDialog } from "./event-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { TimelineEvent } from "@prisma/client"
import { deleteTimelineEvent, reorderTimelineEvents } from "@/app/actions/timeline"
import { toast } from "sonner"

interface TimelineEditorProps {
    initialEvents: TimelineEvent[]
}

export function TimelineEditor({ initialEvents }: TimelineEditorProps) {
    const [events, setEvents] = useState(initialEvents)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setEvents((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)

                const newOrder = arrayMove(items, oldIndex, newIndex)

                // Optimistic UI update
                // Then sync with server
                reorderTimelineEvents(
                    newOrder.map((item, index) => ({ id: item.id, order: index }))
                ).catch(() => {
                    toast.error("Failed to reorder events")
                    setEvents(items) // Revert on failure
                })

                return newOrder
            })
        }
        setActiveId(null)
    }

    const handleEdit = (event: TimelineEvent) => {
        setEditingEvent(event)
        setDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        try {
            setEvents(events.filter(e => e.id !== id))
            await deleteTimelineEvent(id)
            toast.success("Event deleted")
        } catch (error) {
            toast.error("Failed to delete event")
        }
    }

    const handleCreate = () => {
        setEditingEvent(null)
        setDialogOpen(true)
    }

    // Update local state when initialEvents changes (e.g. after server action revalidation)
    // This is a simple way to keep them in sync, though optimitic updates handle most cases.
    // Be careful with this pattern if typing fast, but for reorder/save it's fine.
    if (JSON.stringify(initialEvents) !== JSON.stringify(events)) {
        // Only update if IDs/content changed meaningfully, ignoring purely optimistic order if we trust the server
        // Actually, let's just use key-based reset in the parent or simple effect if needed.
        // For now, rely on standard props flow.
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Milestones</h2>
                <Button onClick={handleCreate} className="bg-amber-600 hover:bg-amber-700 text-white border-none">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                </Button>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black p-4 min-h-[400px]">
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                        <p>No events yet.</p>
                        <Button variant="link" onClick={handleCreate}>Create your first milestone</Button>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={events.map(e => e.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3">
                                {events.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </SortableContext>

                        <DragOverlay>
                            {activeId ? (
                                <EventCard
                                    event={events.find(e => e.id === activeId)!}
                                    onEdit={() => { }}
                                    onDelete={() => { }}
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>

            <EventDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                event={editingEvent}
            />
        </div>
    )
}
