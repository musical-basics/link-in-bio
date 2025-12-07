"use client"

import { useState, useCallback } from "react"
import Cropper, { Area } from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ZoomIn, ZoomOut } from "lucide-react"

interface ImageEditorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    imageUrl: string
    onSave: (cropData: { croppedArea: Area; zoom: number; objectFit: string }) => void
    initialCrop?: { x: number; y: number; zoom: number }
    initialObjectFit?: string
}

export function ImageEditor({
    open,
    onOpenChange,
    imageUrl,
    onSave,
    initialCrop,
    initialObjectFit = "cover"
}: ImageEditorProps) {
    const [crop, setCrop] = useState(initialCrop || { x: 0, y: 0 })
    const [zoom, setZoom] = useState(initialCrop?.zoom || 1)
    const [objectFit, setObjectFit] = useState(initialObjectFit)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = () => {
        if (croppedAreaPixels) {
            onSave({
                croppedArea: croppedAreaPixels,
                zoom,
                objectFit
            })
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile Image</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Image Display Mode Selector */}
                    <div className="space-y-3">
                        <Label>Image Display</Label>
                        <RadioGroup value={objectFit} onValueChange={setObjectFit}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="cover" id="cover" />
                                <Label htmlFor="cover" className="font-normal cursor-pointer">
                                    Cover - Fill entire circle (may crop)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="contain" id="contain" />
                                <Label htmlFor="contain" className="font-normal cursor-pointer">
                                    Contain - Fit entire image (may show background)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fill" id="fill" />
                                <Label htmlFor="fill" className="font-normal cursor-pointer">
                                    Fill - Stretch to fill circle
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Crop Area */}
                    <div className="space-y-3">
                        <Label>Position & Zoom</Label>
                        <div className="relative w-full h-[300px] bg-muted rounded-lg overflow-hidden">
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
                                objectFit={objectFit as "contain" | "cover" | "horizontal-cover" | "vertical-cover"}
                            />
                        </div>
                    </div>

                    {/* Zoom Slider */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Zoom</Label>
                            <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <ZoomOut className="h-4 w-4 text-muted-foreground" />
                            <Slider
                                value={[zoom]}
                                onValueChange={(value) => setZoom(value[0])}
                                min={1}
                                max={3}
                                step={0.1}
                                className="flex-1"
                            />
                            <ZoomIn className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="space-y-3">
                        <Label>Preview</Label>
                        <div className="flex justify-center">
                            <div
                                className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20"
                                style={{
                                    backgroundImage: `url(${imageUrl})`,
                                    backgroundPosition: `${-crop.x * zoom}px ${-crop.y * zoom}px`,
                                    backgroundSize: objectFit === 'cover' ? 'cover' : objectFit === 'contain' ? 'contain' : '100% 100%',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
