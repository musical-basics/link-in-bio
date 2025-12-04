"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"
import type { Link as LinkType } from "@/lib/data"

interface ManageGroupsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    links: LinkType[]
    onUpdateLinks: (links: LinkType[]) => void
}

export function ManageGroupsDialog({
    open,
    onOpenChange,
    links,
    onUpdateLinks,
}: ManageGroupsDialogProps) {
    const [newGroupName, setNewGroupName] = useState("")
    const [editingGroup, setEditingGroup] = useState<string | null>(null)
    const [editedGroupName, setEditedGroupName] = useState("")

    // Get unique groups with their link counts
    const groupCounts = links.reduce((acc, link) => {
        acc[link.group] = (acc[link.group] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const groups = Object.keys(groupCounts).sort()

    const handleAddGroup = () => {
        if (newGroupName.trim() && !groups.includes(newGroupName.trim())) {
            // Groups are defined by their usage in links, so adding a group
            // just means the name is available for selection
            // For now, we'll just close the input
            setNewGroupName("")
        }
    }

    const handleRenameGroup = (oldName: string) => {
        if (editedGroupName.trim() && editedGroupName !== oldName) {
            const updatedLinks = links.map((link) =>
                link.group === oldName ? { ...link, group: editedGroupName.trim() } : link
            )
            onUpdateLinks(updatedLinks)
        }
        setEditingGroup(null)
        setEditedGroupName("")
    }

    const handleDeleteGroup = (groupName: string) => {
        // Move all links in this group to "General"
        const updatedLinks = links.map((link) =>
            link.group === groupName ? { ...link, group: "General" } : link
        )
        onUpdateLinks(updatedLinks)
    }

    const startEditing = (groupName: string) => {
        setEditingGroup(groupName)
        setEditedGroupName(groupName)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Groups</DialogTitle>
                    <DialogDescription>
                        Organize your links by renaming or removing groups.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Add new group */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="New group name..."
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
                        />
                        <Button onClick={handleAddGroup} size="icon" disabled={!newGroupName.trim()}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Existing groups */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {groups.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No groups yet. Add links to create groups.
                            </p>
                        ) : (
                            groups.map((group) => (
                                <div
                                    key={group}
                                    className="flex items-center gap-2 p-2 rounded-lg border bg-card"
                                >
                                    {editingGroup === group ? (
                                        <>
                                            <Input
                                                value={editedGroupName}
                                                onChange={(e) => setEditedGroupName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleRenameGroup(group)
                                                    if (e.key === "Escape") setEditingGroup(null)
                                                }}
                                                className="flex-1"
                                                autoFocus
                                            />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleRenameGroup(group)}
                                            >
                                                <Check className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setEditingGroup(null)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex-1 font-medium">{group}</span>
                                            <Badge variant="secondary">{groupCounts[group]} links</Badge>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => startEditing(group)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            {group !== "General" && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete "{group}" group?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {groupCounts[group]} link(s) will be moved to "General".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                onClick={() => handleDeleteGroup(group)}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
