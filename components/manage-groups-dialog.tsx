"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil } from "lucide-react"
import type { Link as LinkType, Group } from "@/lib/data"
import { groups } from "@/lib/data"

interface ManageGroupsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    links: LinkType[]
    onUpdateLinks: (links: LinkType[]) => void
}

export function ManageGroupsDialog({ open, onOpenChange, links, onUpdateLinks }: ManageGroupsDialogProps) {
    const [editingGroup, setEditingGroup] = useState<string | null>(null)
    const [editDescription, setEditDescription] = useState("")
    const [allGroups, setAllGroups] = useState<Group[]>(groups)

    const groupCounts = links.reduce(
        (acc, link) => {
            acc[link.group] = (acc[link.group] || 0) + 1
            return acc
        },
        {} as Record<string, number>,
    )

    const handleEditGroup = (groupName: string) => {
        // Find group in allGroups or create a default one if it doesn't exist
        const groupInfo = allGroups.find((g) => g.name === groupName)
        setEditingGroup(groupName)
        setEditDescription(groupInfo?.description || "")
    }

    const handleSaveDescription = () => {
        if (editingGroup) {
            const existingGroupIndex = allGroups.findIndex((g) => g.name === editingGroup)

            if (existingGroupIndex >= 0) {
                // Update existing group
                const newGroups = [...allGroups]
                newGroups[existingGroupIndex] = { ...newGroups[existingGroupIndex], description: editDescription }
                setAllGroups(newGroups)
            } else {
                // Add new group entry if it didn't exist in the list (e.g. created via Add Link)
                setAllGroups([...allGroups, { name: editingGroup, description: editDescription }])
            }

            setEditingGroup(null)
            setEditDescription("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Groups</DialogTitle>
                    <DialogDescription>Overview and customize your link groups.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {Object.entries(groupCounts).map(([groupName, count]) => {
                        const groupInfo = allGroups.find((g) => g.name === groupName)
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
                    {Object.keys(groupCounts).length === 0 && (
                        <div className="text-center text-muted-foreground py-8">No groups yet. Add links to create groups.</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
