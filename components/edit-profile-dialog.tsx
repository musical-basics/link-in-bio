"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProfile } from "@/app/actions/profile"

interface EditProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData: {
        name: string
        bio?: string | null
        imageUrl?: string | null
    }
    onSuccess: () => void
}

export function EditProfileDialog({ open, onOpenChange, initialData, onSuccess }: EditProfileDialogProps) {
    const [name, setName] = useState(initialData.name)
    const [bio, setBio] = useState(initialData.bio || "")
    const [imageUrl, setImageUrl] = useState(initialData.imageUrl || "")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const result = await updateProfile({
            name,
            bio: bio || null,
            imageUrl: imageUrl || null,
        })

        setIsLoading(false)

        if (result.success) {
            onSuccess()
            onOpenChange(false)
        } else {
            alert("Failed to update profile")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your public profile information</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Designer, Developer & Creator"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Profile Image URL</Label>
                            <Input
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="/diverse-person-portrait.png"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter a URL to your profile image
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
