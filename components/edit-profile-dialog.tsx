"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProfile } from "@/app/actions/profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload } from "lucide-react"

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
    const [imagePreview, setImagePreview] = useState<string | null>(initialData.imageUrl || null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (2MB limit for base64 storage)
        const maxSize = 2 * 1024 * 1024 // 2MB
        if (file.size > maxSize) {
            setError("Image must be less than 2MB. Please use a smaller image or an image URL.")
            e.target.value = "" // Reset input
            return
        }

        setError(null)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            setImagePreview(base64String)
            setImageUrl(base64String)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const result = await updateProfile({
                name,
                bio: bio || undefined,
                imageUrl: imageUrl || undefined,
            })

            setIsLoading(false)

            if (result.success) {
                onSuccess()
                onOpenChange(false)
            } else {
                setError(result.error || "Failed to update profile. Please try again.")
            }
        } catch (err) {
            setIsLoading(false)
            setError("An unexpected error occurred. Please try using an image URL instead of uploading.")
            console.error("Profile update error:", err)
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
                        {/* Error Message */}
                        {error && (
                            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Profile Image Upload */}
                        <div className="space-y-2">
                            <Label>Profile Image</Label>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20 border-2 border-primary/20">
                                    <AvatarImage src={imagePreview || "/placeholder.svg"} />
                                    <AvatarFallback>
                                        {name.split(" ").map((n) => n[0]).join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <label
                                        htmlFor="image-upload"
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full cursor-pointer"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Image
                                    </label>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        JPG, PNG, or GIF (max 2MB)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Or URL Input */}
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Or enter image URL</Label>
                            <Input
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => {
                                    setImageUrl(e.target.value)
                                    setImagePreview(e.target.value)
                                }}
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

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
