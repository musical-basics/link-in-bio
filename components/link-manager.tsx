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
  } = useSortable({ id: `group-${groupName}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="border-b pb-2 flex items-center gap-2">
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

// Links section component with its own DndContext
function GroupLinksSection({
  groupLinks,
  allLinks,
  setLinks,
  onUpdateLink,
  onDeleteLink,
  handleEditLink,
}: {
  groupLinks: LinkType[]
  allLinks: LinkType[]
  setLinks: (links: LinkType[]) => void
  onUpdateLink?: (link: LinkType) => void
  onDeleteLink?: (link: LinkType) => void
  handleEditLink: (link: LinkType) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleLinkDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const activeLink = groupLinks.find(l => l.id === active.id)
      const overLink = groupLinks.find(l => l.id === over.id)

      if (activeLink && overLink) {
        const oldIndex = groupLinks.findIndex(l => l.id === active.id)
        const newIndex = groupLinks.findIndex(l => l.id === over.id)

        const reorderedGroupLinks = arrayMove(groupLinks, oldIndex, newIndex)

        // Update order property for the reordered group
        const updatedGroupLinks = reorderedGroupLinks.map((link, index) => ({
          ...link,
          order: index + 1,
        }))

        // Replace old group links with updated ones in the full links array
        const otherLinks = allLinks.filter(l => l.group !== activeLink.group)
        const newAllLinks = [...otherLinks, ...updatedGroupLinks]
        setLinks(newAllLinks)

        // Update server for each changed link
        updatedGroupLinks.forEach(link => {
          if (onUpdateLink) {
            onUpdateLink(link)
          }
        })
      }
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLinkDragEnd}>
      <SortableContext items={groupLinks.map((link) => link.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 ml-6">
          {groupLinks.map((link) => (
            <LinkRow key={link.id} link={link} onEdit={handleEditLink} onDelete={onDeleteLink} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export function LinkManager({ links, setLinks, onUpdateLink, onDeleteLink, availableGroups, groups, onReorderGroups }: LinkManagerProps) {
  const [editingLink, setEditingLink] = useState<LinkType | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  const groupSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

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

  // Sort groups by order (immutable sort!) - memoized
  const sortedGroupNames = useMemo(() => {
    const sortedGroups = [...groups].sort((a, b) => a.order - b.order)
    return [...new Set([
      ...sortedGroups.map(g => g.name),
      ...Object.keys(groupedLinks)
    ])].filter(name => groupedLinks[name]?.length > 0)
  }, [groups, groupedLinks])

  // Handle group reordering
  function handleGroupDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const activeId = active.id as string
      const overId = over.id as string

      // Only handle group drags (prefixed with group-)
      if (activeId.startsWith('group-') && overId.startsWith('group-')) {
        const activeGroupName = activeId.replace('group-', '')
        const overGroupName = overId.replace('group-', '')

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
      <div className="space-y-6">
        {/* Group Headers DndContext - only for group reordering */}
        <DndContext sensors={groupSensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
          <SortableContext items={sortedGroupNames.map(name => `group-${name}`)} strategy={verticalListSortingStrategy}>
            {sortedGroupNames.map((groupName) => {
              const sortedGroupLinks = [...(groupedLinks[groupName] || [])].sort((a, b) => a.order - b.order)
              const groupInfo = groups.find(g => g.name === groupName)

              return (
                <div key={groupName} className="space-y-2">
                  {/* Sortable Group Header */}
                  <SortableGroupHeader groupName={groupName} groupInfo={groupInfo} />

                  {/* Links Section - completely separate DndContext */}
                  <GroupLinksSection
                    groupLinks={sortedGroupLinks}
                    allLinks={links}
                    setLinks={setLinks}
                    onUpdateLink={onUpdateLink}
                    onDeleteLink={onDeleteLink}
                    handleEditLink={handleEditLink}
                  />
                </div>
              )
            })}
          </SortableContext>
        </DndContext>

        {sortedGroupNames.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No links yet. Click "Add New Link" to get started.
          </div>
        )}
      </div>

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
