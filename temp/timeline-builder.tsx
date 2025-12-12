"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus, Eye, Save } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TimelineEventRow } from "./timeline-event-row"
import { EditTimelineEventSheet } from "./edit-timeline-event-sheet"
import type { TimelineEvent } from "@/lib/timeline-data"
import { defaultTimelineEvents } from "@/lib/timeline-data"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function TimelineBuilder() {
  const [events, setEvents] = useState<TimelineEvent[]>(defaultTimelineEvents)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [isNewEvent, setIsNewEvent] = useState(false)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = events.findIndex((e) => e.id === active.id)
      const newIndex = events.findIndex((e) => e.id === over.id)
      setEvents(arrayMove(events, oldIndex, newIndex))
    }
  }

  const handleEditEvent = (event: TimelineEvent) => {
    setEditingEvent(event)
    setIsNewEvent(false)
    setIsEditSheetOpen(true)
  }

  const handleAddEvent = () => {
    setEditingEvent(null)
    setIsNewEvent(true)
    setIsEditSheetOpen(true)
  }

  const handleSaveEvent = (updatedEvent: TimelineEvent) => {
    if (isNewEvent) {
      setEvents([...events, updatedEvent])
    } else {
      setEvents(events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)))
    }
  }

  const handleDeleteEvent = (eventId: string) => {
    setDeleteEventId(eventId)
  }

  const confirmDelete = () => {
    if (deleteEventId) {
      setEvents(events.filter((e) => e.id !== deleteEventId))
      setDeleteEventId(null)
    }
  }

  // Group events by year for stats
  const eventsByYear = events.reduce(
    (acc, event) => {
      acc[event.year] = (acc[event.year] || 0) + 1
      return acc
    },
    {} as Record<number, number>,
  )

  const yearsCount = Object.keys(eventsByYear).length

  return (
    <div className="min-h-screen bg-black">
      {/* Spotlight Background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-zinc-900/20 to-transparent" />

      <div className="relative mx-auto max-w-5xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold text-white">Timeline Builder</h1>
            <p className="mt-2 text-zinc-400">Drag and drop to reorder your milestones</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/timeline-demo2">
              <Button variant="outline" className="border-white/10 bg-transparent text-white hover:bg-white/10">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </Link>
            <Button className="bg-white text-black hover:bg-zinc-200">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500">Total Events</CardDescription>
              <CardTitle className="text-3xl text-white">{events.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500">Years Covered</CardDescription>
              <CardTitle className="text-3xl text-white">{yearsCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-white/10 bg-zinc-900/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500">Timeline Span</CardDescription>
              <CardTitle className="text-3xl text-white">
                {events.length > 0
                  ? `${Math.min(...events.map((e) => e.year))} - ${Math.max(...events.map((e) => e.year))}`
                  : "N/A"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Event Manager */}
        <Card className="border-white/10 bg-zinc-900/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Milestones</CardTitle>
              <CardDescription className="text-zinc-500">Click on an event to edit, or drag to reorder</CardDescription>
            </div>
            <Button onClick={handleAddEvent} className="bg-amber-500/20 text-amber-200 hover:bg-amber-500/30">
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={events.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {events.map((event) => (
                    <TimelineEventRow
                      key={event.id}
                      event={event}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {events.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-zinc-800 p-4">
                  <Plus className="h-8 w-8 text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium text-white">No events yet</h3>
                <p className="mt-1 text-sm text-zinc-500">Add your first milestone to start building your timeline.</p>
                <Button onClick={handleAddEvent} className="mt-4 bg-white text-black hover:bg-zinc-200">
                  Add Your First Event
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Sheet */}
      <EditTimelineEventSheet
        event={editingEvent}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        onSave={handleSaveEvent}
        isNew={isNewEvent}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
        <AlertDialogContent className="border-white/10 bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Event</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this milestone? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
