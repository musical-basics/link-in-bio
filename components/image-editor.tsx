"use client"

import { useState, useCallback } from "react"
import Cropper, { Area } from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, Loader2 } from "lucide-react"

interface ImageEditorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    imageUrl: string
    // CHANGE: onSave now returns the actual cropped image string, not just coordinates
    onSave: (croppedImage: string) => void
}

export function ImageEditor({
    open,
    onOpenChange,
    imageUrl,
    onSave,
}: ImageEditorProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    // --- UTILITY: Create the cropped image ---
    const createCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image()
            img.addEventListener('load', () => resolve(img))
            img.addEventListener('error', (error) => reject(error))
            img.src = imageSrc
        })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            throw new Error('No 2d context')
        }

        // Set canvas size to the cropped size
        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        // Draw the cropped image onto the canvas
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        )

        // Return as Base64 string
        return canvas.toDataURL('image/jpeg', 0.9)
    }

    const handleSave = async () => {
        if (!croppedAreaPixels) return

        setIsProcessing(true)
        try {
            const croppedImage = await createCroppedImage(imageUrl, croppedAreaPixels)
            onSave(croppedImage)
            onOpenChange(false)
        } catch (e) {
            console.error(e)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Edit Profile Image</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Crop Area */}
                    <div className="relative w-full h-[350px] bg-black/50 rounded-lg overflow-hidden border border-zinc-800">
                        <Cropper
                            image={imageUrl}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                            // Restrict zoom to keep image within bounds if desired, or allow free roam
                            minZoom={1}
                            maxZoom={3}
                        />
                    </div>
                    <p className="text-xs text-zinc-500 text-center">
                        Drag to position • Scroll to zoom
                    </p>

                    {/* Zoom Controls */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-zinc-400">Zoom</Label>
                            <span className="text-sm text-zinc-500">{Math.round(zoom * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                                className="text-zinc-400 hover:text-white"
                                type="button"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </button>

                            <Slider
                                value={[zoom]}
                                onValueChange={(value) => setZoom(value[0])}
                                min={1}
                                max={3}
                                step={0.01}
                                className="flex-1"
                            />

                            <button
                                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                                className="text-zinc-400 hover:text-white"
                                type="button"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isProcessing} className="bg-white text-black hover:bg-zinc-200">
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Apply Crop"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
