"use client"

import { useState } from "react"
import type { Link as LinkType } from "@/lib/data"
import { LinkRow } from "./link-row"
import { EditLinkSheet } from "./edit-link-sheet"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

interface Group {
  id: string
  name: string
  description: string | null
  order: number
}

interface LinkManagerProps {
  links: LinkType[]
  setLinks: (links: LinkType[]) => void
  onUpdateLink?: (link: LinkType) => void
  onDeleteLink?: (link: LinkType) => void
  availableGroups: string[]
  groups: Group[]
  onReorderGroups?: (groupNames: string[]) => void
}

// Sortable Group Section component
function SortableGroupSection({
  groupName,
  groupInfo,
  groupLinks,
  sensors,
  handleDragEnd,
  handleEditLink,
  onDeleteLink
}: {
  groupName: string
  groupInfo?: Group
  groupLinks: LinkType[]
  sensors: ReturnType<typeof useSensors>
  handleDragEnd: (event: DragEndEvent) => void
  handleEditLink: (link: LinkType) => void
  onDeleteLink?: (link: LinkType) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${groupName}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      {/* Group Header with drag handle */}
      <div className="border-b pb-2 flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {groupName}
          </h3>
          {groupInfo?.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{groupInfo.description}</p>
          )}
        </div>
      </div>

      {/* Links in this group */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={groupLinks.map((link) => link.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {groupLinks.map((link) => (
              <LinkRow key={link.id} link={link} onEdit={handleEditLink} onDelete={onDeleteLink} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

export function LinkManager({ links, setLinks, onUpdateLink, onDeleteLink, availableGroups, groups, onReorderGroups }: LinkManagerProps) {
  const [editingLink, setEditingLink] = useState<LinkType | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Group links by their group field
  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.group]) {
      acc[link.group] = []
    }
    acc[link.group].push(link)
    return acc
  }, {} as Record<string, LinkType[]>)

  // Sort groups by order (from DB groups first, then any remaining)
  const sortedGroupNames = [...new Set([
    ...groups.sort((a, b) => a.order - b.order).map(g => g.name),
    ...Object.keys(groupedLinks)
  ])].filter(name => groupedLinks[name]?.length > 0)

  // Handle group reordering
  function handleGroupDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const activeGroupName = (active.id as string).replace('group-', '')
      const overGroupName = (over.id as string).replace('group-', '')

      const oldIndex = sortedGroupNames.indexOf(activeGroupName)
      const newIndex = sortedGroupNames.indexOf(overGroupName)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(sortedGroupNames, oldIndex, newIndex)
        if (onReorderGroups) {
          onReorderGroups(newOrder)
        }
      }
    }
  }

  // Handle link reordering within a group
  function handleLinkDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const activeLink = links.find(l => l.id === active.id)
      const overLink = links.find(l => l.id === over.id)

      // Only allow reordering within same group
      if (activeLink && overLink && activeLink.group === overLink.group) {
        const groupLinks = links.filter(l => l.group === activeLink.group)
        const otherLinks = links.filter(l => l.group !== activeLink.group)

        const oldIndex = groupLinks.findIndex(l => l.id === active.id)
        const newIndex = groupLinks.findIndex(l => l.id === over.id)

        const reorderedGroupLinks = arrayMove(groupLinks, oldIndex, newIndex)

        // Update order property for the reordered group
        const updatedGroupLinks = reorderedGroupLinks.map((link, index) => ({
          ...link,
          order: index + 1,
        }))

        // Combine with other links
        const allLinks = [...otherLinks, ...updatedGroupLinks]
        setLinks(allLinks)

        // Update server for each changed link
        updatedGroupLinks.forEach(link => {
          if (onUpdateLink) {
            onUpdateLink(link)
          }
        })
      }
    }
  }

  const handleEditLink = (link: LinkType) => {
    setEditingLink(link)
    setIsEditSheetOpen(true)
  }

  const handleSaveLink = (updatedLink: LinkType) => {
    if (onUpdateLink) {
      onUpdateLink(updatedLink)
    } else {
      setLinks(links.map((link) => (link.id === updatedLink.id ? updatedLink : link)))
    }
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
        <SortableContext items={sortedGroupNames.map(name => `group-${name}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {sortedGroupNames.map((groupName) => {
              const groupLinks = (groupedLinks[groupName] || []).sort((a, b) => a.order - b.order)
              const groupInfo = groups.find(g => g.name === groupName)

              return (
                <SortableGroupSection
                  key={groupName}
                  groupName={groupName}
                  groupInfo={groupInfo}
                  groupLinks={groupLinks}
                  sensors={sensors}
                  handleDragEnd={handleLinkDragEnd}
                  handleEditLink={handleEditLink}
                  onDeleteLink={onDeleteLink}
                />
              )
            })}

            {sortedGroupNames.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No links yet. Click "Add New Link" to get started.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <EditLinkSheet
        link={editingLink}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        onSave={handleSaveLink}
        availableGroups={availableGroups}
      />
    </>
  )
}
