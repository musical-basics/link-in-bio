"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { upsertTimelineEvent } from "@/app/actions/timeline"
import { toast } from "sonner"
import { Upload, Loader2 } from "lucide-react"
import type { TimelineEvent } from "@prisma/client"
import { getSupabase } from "@/lib/supabase"

// Add this helper function outside the component
const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const MAX_WIDTH = 1920
                const MAX_HEIGHT = 1080
                let width = img.width
                let height = img.height

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width
                        width = MAX_WIDTH
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height
                        height = MAX_HEIGHT
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                // Fill background with white (for transparent PNGs converting to JPEG)
                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(0, 0, canvas.width, canvas.height)

                // Draw image
                ctx.drawImage(img, 0, 0, width, height)

                // Convert to blob (JPEG, 0.85 quality)
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Compression failed'))
                    }
                }, 'image/jpeg', 0.85)
            }
            img.onerror = (error) => reject(error)
        }
        reader.onerror = (error) => reject(error)
    })
}

interface EventDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    event?: TimelineEvent | null
    userId: string
}

export function EventDialog({ open, onOpenChange, event, userId }: EventDialogProps) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [formData, setFormData] = useState({
        title: "",
        year: new Date().getFullYear(),
        description: "",
        mediaUrl: "",
        mediaType: "image"
    })

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                year: event.year,
                description: event.description || "",
                mediaUrl: event.mediaUrl || "",
                mediaType: event.mediaType || "image"
            })
        } else {
            setFormData({
                title: "",
                year: new Date().getFullYear(),
                description: "",
                mediaUrl: "",
                mediaType: "image"
            })
        }
    }, [event, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await upsertTimelineEvent({
                id: event?.id,
                title: formData.title,
                year: formData.year,
                description: formData.description,
                mediaUrl: formData.mediaUrl,
                mediaType: formData.mediaType,
            })
            toast.success(event ? "Event updated" : "Event created")
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Failed to save event")
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Increased limit to 25MB since we are compressing
        if (file.size > 25 * 1024 * 1024) {
            toast.error("File is too large (max 25MB)")
            return
        }

        setUploading(true)
        try {
            // Compress image before upload
            const compressedBlob = await compressImage(file)

            // Convert Blob back to File for Supabase upload
            const compressedFile = new File([compressedBlob], "image.jpg", {
                type: "image/jpeg",
                lastModified: Date.now()
            })

            const supabase = getSupabase()
            // Always use .jpg extension since we converted to JPEG
            const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`

            const { data, error } = await supabase.storage
                .from('timeline-media')
                .upload(fileName, compressedFile, {
                    cacheControl: '31536000',
                    upsert: false
                })

            if (error) {
                console.error("Supabase upload error:", error)
                throw error
            }

            const { data: { publicUrl } } = supabase.storage
                .from('timeline-media')
                .getPublicUrl(fileName)

            setFormData({
                ...formData,
                mediaUrl: publicUrl,
                mediaType: "image"
            })
            toast.success("Image uploaded & compressed")
        } catch (error) {
            console.error("Upload failed:", error)
            toast.error("Failed to upload image. Please try again.")
        } finally {
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>{event ? "Edit Event" : "Add New Event"}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {event ? "Modify the details of your timeline event." : "Create a new milestone for your story."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. First Piano Lesson"
                            className="bg-black/50 border-zinc-800"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="year">Year</Label>
                            <Input
                                id="year"
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                className="bg-black/50 border-zinc-800"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="mediaType">Media Type</Label>
                            <Select
                                value={formData.mediaType}
                                onValueChange={(value) => setFormData({ ...formData, mediaType: value })}
                            >
                                <SelectTrigger className="bg-black/50 border-zinc-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Media</Label>
                        <div className="flex flex-col gap-4">
                            {/* Image Upload */}
                            <div className="flex items-center gap-4">
                                {formData.mediaType === "image" && formData.mediaUrl && (
                                    <div className="relative h-20 w-20 overflow-hidden rounded-md border border-zinc-700">
                                        <img src={formData.mediaUrl} alt="Preview" className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <label
                                        htmlFor="event-media-upload"
                                        className={`inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-800 bg-black/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        {uploading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="mr-2 h-4 w-4" />
                                        )}
                                        {uploading ? "Uploading..." : "Upload Image"}
                                    </label>
                                    <input
                                        id="event-media-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploading}
                                        onChange={handleFileUpload}
                                    />
                                    <p className="mt-1 text-xs text-zinc-500">Max 25MB. Automatically compressed & converted to JPEG.</p>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-zinc-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-zinc-900 px-2 text-zinc-400">Or use URL</span>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="mediaUrl" className="text-xs text-zinc-400">Media URL (Image or Video)</Label>
                                <Input
                                    id="mediaUrl"
                                    value={formData.mediaUrl}
                                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="bg-black/50 border-zinc-800"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Tell the story of this memory..."
                            className="bg-black/50 border-zinc-800 min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-white text-black hover:bg-zinc-200">
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
