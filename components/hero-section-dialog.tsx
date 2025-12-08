"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { updateProfile } from "@/app/actions/profile"
import { getSupabase } from "@/lib/supabase"
import { Upload, Video, X, CheckCircle, AlertCircle } from "lucide-react"

interface HeroSectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData: {
        heroHeadline?: string | null
        heroSubtitle?: string | null
        heroVideoUrl?: string | null
        showHero?: boolean | null
    }
    onSuccess: () => void
    userId: string
}

const MAX_FILE_SIZE = 40 * 1024 * 1024 // 40MB

export function HeroSectionDialog({ open, onOpenChange, initialData, onSuccess, userId }: HeroSectionDialogProps) {
    const [showHero, setShowHero] = useState(initialData.showHero !== false)
    const [heroHeadline, setHeroHeadline] = useState(initialData.heroHeadline || "My Story")
    const [heroSubtitle, setHeroSubtitle] = useState(initialData.heroSubtitle || "Welcome to my musical journey.")
    const [heroVideoUrl, setHeroVideoUrl] = useState(initialData.heroVideoUrl || "")

    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [uploadSuccess, setUploadSuccess] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.includes('mp4') && !file.name.endsWith('.mp4')) {
            setUploadError("Only .mp4 files are allowed for best browser compatibility.")
            return
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setUploadError(`File too large. Maximum size is 40MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Try compressing with HandBrake or similar.`)
            return
        }

        setUploadError(null)
        setUploadSuccess(false)
        setIsUploading(true)
        setUploadProgress(0)

        try {
            // Generate unique filename
            const timestamp = Date.now()
            const filename = `${userId}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

            // Upload to Supabase Storage
            const supabase = getSupabase()
            const { data, error } = await supabase.storage
                .from('hero-videos')
                .upload(filename, file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (error) {
                throw error
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('hero-videos')
                .getPublicUrl(filename)

            setHeroVideoUrl(urlData.publicUrl)
            setUploadSuccess(true)
            setUploadProgress(100)
        } catch (error: any) {
            console.error('Upload error:', error)
            setUploadError(error.message || "Failed to upload video. Please try again.")
        } finally {
            setIsUploading(false)
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    // Simulate progress for better UX (Supabase doesn't provide granular progress)
    const simulateProgress = () => {
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval)
                    return prev
                }
                return prev + 10
            })
        }, 300)
        return interval
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await updateProfile({
                heroHeadline,
                heroSubtitle,
                heroVideoUrl: heroVideoUrl || null,
                showHero,
            })

            if (result.success) {
                onSuccess()
                onOpenChange(false)
            } else {
                setUploadError(result.error || "Failed to save changes.")
            }
        } catch (error) {
            console.error("Save error:", error)
            setUploadError("An unexpected error occurred.")
        } finally {
            setIsLoading(false)
        }
    }

    const clearVideo = () => {
        setHeroVideoUrl("")
        setUploadSuccess(false)
        setUploadProgress(0)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Hero Section Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure the cinematic hero card on your public profile.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="showHero" className="text-base font-medium">Show Hero Section</Label>
                            <p className="text-sm text-muted-foreground">Display a cinematic hero card on your profile</p>
                        </div>
                        <Switch
                            id="showHero"
                            checked={showHero}
                            onCheckedChange={setShowHero}
                        />
                    </div>

                    {showHero && (
                        <>
                            {/* Headline */}
                            <div className="space-y-2">
                                <Label htmlFor="heroHeadline">Headline</Label>
                                <Input
                                    id="heroHeadline"
                                    value={heroHeadline}
                                    onChange={(e) => setHeroHeadline(e.target.value)}
                                    placeholder="My Story"
                                />
                            </div>

                            {/* Subtitle */}
                            <div className="space-y-2">
                                <Label htmlFor="heroSubtitle">Subtitle</Label>
                                <Textarea
                                    id="heroSubtitle"
                                    value={heroSubtitle}
                                    onChange={(e) => setHeroSubtitle(e.target.value)}
                                    placeholder="Welcome to my musical journey."
                                    rows={2}
                                />
                            </div>

                            {/* Video Upload Section */}
                            <div className="space-y-3">
                                <Label>Background Video</Label>

                                {/* Upload Button */}
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="flex-1"
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        {isUploading ? "Uploading..." : "Upload Video"}
                                    </Button>
                                    {heroVideoUrl && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={clearVideo}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/mp4,.mp4"
                                    onChange={handleVideoUpload}
                                    className="hidden"
                                />

                                <p className="text-xs text-muted-foreground">
                                    MP4 only, max 40MB. Short 20-30s loops work best. Compress with <a href="https://handbrake.fr" target="_blank" rel="noopener" className="underline">HandBrake</a> if needed.
                                </p>

                                {/* Progress Bar */}
                                {isUploading && (
                                    <div className="space-y-2">
                                        <Progress value={uploadProgress} className="h-2" />
                                        <p className="text-sm text-muted-foreground text-center">
                                            Uploading... {uploadProgress}%
                                        </p>
                                    </div>
                                )}

                                {/* Success Message */}
                                {uploadSuccess && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        Video uploaded successfully!
                                    </div>
                                )}

                                {/* Error Message */}
                                {uploadError && (
                                    <div className="flex items-center gap-2 text-sm text-destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        {uploadError}
                                    </div>
                                )}

                                {/* Video URL Input (alternative) */}
                                <div className="space-y-2">
                                    <Label htmlFor="heroVideoUrl" className="text-sm text-muted-foreground">
                                        Or paste a video URL
                                    </Label>
                                    <Input
                                        id="heroVideoUrl"
                                        value={heroVideoUrl}
                                        onChange={(e) => setHeroVideoUrl(e.target.value)}
                                        placeholder="https://example.com/video.mp4"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty for the default piano video background.
                                    </p>
                                </div>

                                {/* Video Preview */}
                                {heroVideoUrl && (
                                    <div className="rounded-lg overflow-hidden border">
                                        <video
                                            src={heroVideoUrl}
                                            className="w-full h-32 object-cover"
                                            muted
                                            loop
                                            autoPlay
                                            playsInline
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || isUploading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
