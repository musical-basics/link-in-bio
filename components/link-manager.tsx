"use client"

import { useState, useMemo } from "react"
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

// Sortable Group Header component
function SortableGroupHeader({
  groupName,
  groupInfo,
}: {
  groupName: string
  groupInfo?: Group
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group:${groupName}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="border-b pb-2 flex items-center gap-2 mb-2 mt-4 first:mt-0">
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

  // Sort groups by order (immutable sort!) - memoized
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.order - b.order)
  }, [groups])

  // Group links by their group field - memoized
  const groupedLinks = useMemo(() => {
    return links.reduce((acc, link) => {
      if (!acc[link.group]) {
        acc[link.group] = []
      }
      acc[link.group].push(link)
      return acc
    }, {} as Record<string, LinkType[]>)
  }, [links])

  // Get sorted group names
  const sortedGroupNames = useMemo(() => {
    return [...new Set([
      ...sortedGroups.map(g => g.name),
      ...Object.keys(groupedLinks)
    ])].filter(name => groupedLinks[name]?.length > 0)
  }, [sortedGroups, groupedLinks])

  // Build flat list of sortable IDs (groups and links interleaved)
  const allSortableIds = useMemo(() => {
    const ids: string[] = []
    for (const groupName of sortedGroupNames) {
      ids.push(`group:${groupName}`)
      const groupLinks = [...(groupedLinks[groupName] || [])].sort((a, b) => a.order - b.order)
      for (const link of groupLinks) {
        ids.push(`link:${link.id}`)
      }
    }
    return ids
  }, [sortedGroupNames, groupedLinks])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    // Handle GROUP reordering
    if (activeId.startsWith('group:') && overId.startsWith('group:')) {
      const activeGroupName = activeId.replace('group:', '')
      const overGroupName = overId.replace('group:', '')

      const oldIndex = sortedGroupNames.indexOf(activeGroupName)
      const newIndex = sortedGroupNames.indexOf(overGroupName)

      if (oldIndex !== -1 && newIndex !== -1 && onReorderGroups) {
        const newOrder = arrayMove(sortedGroupNames, oldIndex, newIndex)
        onReorderGroups(newOrder)
      }
      return
    }

    // Handle LINK reordering (link dropped on link)
    if (activeId.startsWith('link:') && overId.startsWith('link:')) {
      const activeLinkId = activeId.replace('link:', '')
      const overLinkId = overId.replace('link:', '')

      const activeLink = links.find(l => l.id === activeLinkId)
      const overLink = links.find(l => l.id === overLinkId)

      // Only allow reordering within same group
      if (activeLink && overLink && activeLink.group === overLink.group) {
        const groupName = activeLink.group
        const groupLinks = [...(groupedLinks[groupName] || [])].sort((a, b) => a.order - b.order)

        const oldIndex = groupLinks.findIndex(l => l.id === activeLinkId)
        const newIndex = groupLinks.findIndex(l => l.id === overLinkId)

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedGroupLinks = arrayMove(groupLinks, oldIndex, newIndex)

          // Update order property
          const updatedGroupLinks = reorderedGroupLinks.map((link, index) => ({
            ...link,
            order: index + 1,
          }))

          // Replace in full links array
          const otherLinks = links.filter(l => l.group !== groupName)
          setLinks([...otherLinks, ...updatedGroupLinks])

          // Persist to server
          updatedGroupLinks.forEach(link => {
            if (onUpdateLink) onUpdateLink(link)
          })
        }
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={allSortableIds} strategy={verticalListSortingStrategy}>
          <div>
            {sortedGroupNames.map((groupName) => {
              const sortedGroupLinks = [...(groupedLinks[groupName] || [])].sort((a, b) => a.order - b.order)
              const groupInfo = groups.find(g => g.name === groupName)

              return (
                <div key={groupName}>
                  <SortableGroupHeader groupName={groupName} groupInfo={groupInfo} />
                  <div className="space-y-2 ml-6">
                    {sortedGroupLinks.map((link) => (
                      <LinkRow
                        key={link.id}
                        link={link}
                        onEdit={handleEditLink}
                        onDelete={onDeleteLink}
                        sortableId={`link:${link.id}`}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {sortedGroupNames.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No links yet. Click "Add New Link" to get started.
        </div>
      )}

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
