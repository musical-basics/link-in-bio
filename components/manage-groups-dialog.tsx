"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Plus } from "lucide-react"
import type { Link as LinkType } from "@/lib/data"
import { updateGroupDescription, createGroup } from "@/app/actions/groups"

interface Group {
    id: string
    name: string
    description: string | null
    order: number
}

interface ManageGroupsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    links: LinkType[]
    groups: Group[]
    onUpdateLinks: (links: LinkType[]) => void
    onRefreshGroups: () => void
}

export function ManageGroupsDialog({
    open,
    onOpenChange,
    links,
    groups,
    onUpdateLinks,
    onRefreshGroups,
}: ManageGroupsDialogProps) {
    const [editingGroup, setEditingGroup] = useState<string | null>(null)
    const [editDescription, setEditDescription] = useState("")
    const [isAddingGroup, setIsAddingGroup] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [newGroupDescription, setNewGroupDescription] = useState("")

    const groupCounts = links.reduce(
        (acc, link) => {
            acc[link.group] = (acc[link.group] || 0) + 1
            return acc
        },
        {} as Record<string, number>,
    )

    // Combine groups from DB with groups that only exist in links
    const allGroupNames = [...new Set([...groups.map(g => g.name), ...Object.keys(groupCounts)])]

    const handleEditGroup = (groupName: string) => {
        const groupInfo = groups.find((g) => g.name === groupName)
        setEditingGroup(groupName)
        setEditDescription(groupInfo?.description || "")
    }

    const handleSaveDescription = async () => {
        if (editingGroup) {
            const result = await updateGroupDescription(editingGroup, editDescription)
            if (result.success) {
                onRefreshGroups()
            }
            setEditingGroup(null)
            setEditDescription("")
        }
    }

    const handleAddGroup = async () => {
        if (!newGroupName.trim()) return
        const result = await createGroup(newGroupName.trim(), newGroupDescription.trim() || undefined)
        if (result.success) {
            onRefreshGroups()
            setNewGroupName("")
            setNewGroupDescription("")
            setIsAddingGroup(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Manage Groups</DialogTitle>
                            <DialogDescription>Overview and customize your link groups.</DialogDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsAddingGroup(true)} className="ml-4">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Group
                        </Button>
                    </div>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Add New Group Form */}
                    {isAddingGroup && (
                        <div className="rounded-lg border border-primary p-4 space-y-3">
                            <div>
                                <Label htmlFor="newGroupName" className="text-sm font-medium">New Group Name</Label>
                                <Input
                                    id="newGroupName"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="e.g., Music, Products, Socials"
                                    className="mt-1"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Label htmlFor="newGroupDesc" className="text-xs">Description (optional)</Label>
                                <Input
                                    id="newGroupDesc"
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                    placeholder="Add a description for this group"
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    setIsAddingGroup(false)
                                    setNewGroupName("")
                                    setNewGroupDescription("")
                                }}>
                                    Cancel
                                </Button>
                                <Button type="button" size="sm" onClick={handleAddGroup} disabled={!newGroupName.trim()}>
                                    Create Group
                                </Button>
                            </div>
                        </div>
                    )}
                    {allGroupNames.map((groupName) => {
                        const groupInfo = groups.find((g) => g.name === groupName)
                        const count = groupCounts[groupName] || 0
                        const isEditing = editingGroup === groupName

                        return (
                            <div key={groupName} className="rounded-lg border p-4">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-sm font-medium">{groupName}</Label>
                                        </div>
                                        <div>
                                            <Label htmlFor="description" className="text-xs">
                                                Description (optional)
                                            </Label>
                                            <Input
                                                id="description"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                placeholder="Add a description for this group"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={() => setEditingGroup(null)}>
                                                Cancel
                                            </Button>
                                            <Button type="button" size="sm" onClick={handleSaveDescription}>
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{groupName}</h4>
                                            {groupInfo?.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{groupInfo.description}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {count} {count === 1 ? "link" : "links"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{count}</Badge>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => handleEditGroup(groupName)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    {allGroupNames.length === 0 && !isAddingGroup && (
                        <div className="text-center text-muted-foreground py-8">No groups yet. Click "Add Group" to create one.</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
