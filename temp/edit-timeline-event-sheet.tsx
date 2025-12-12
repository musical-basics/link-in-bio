"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TimelineEvent } from "@/lib/timeline-data"
import {
  Music,
  Mic,
  Youtube,
  Award,
  MapPin,
  Star,
  Heart,
  Zap,
  Trophy,
  Camera,
  Video,
  Globe,
  BookOpen,
  Briefcase,
  GraduationCap,
  Plane,
  Upload,
  ImageIcon,
} from "lucide-react"

const ICON_OPTIONS = [
  { name: "Music", icon: Music },
  { name: "Mic", icon: Mic },
  { name: "Youtube", icon: Youtube },
  { name: "Award", icon: Award },
  { name: "MapPin", icon: MapPin },
  { name: "Star", icon: Star },
  { name: "Heart", icon: Heart },
  { name: "Zap", icon: Zap },
  { name: "Trophy", icon: Trophy },
  { name: "Camera", icon: Camera },
  { name: "Video", icon: Video },
  { name: "Globe", icon: Globe },
  { name: "BookOpen", icon: BookOpen },
  { name: "Briefcase", icon: Briefcase },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Plane", icon: Plane },
]

interface EditTimelineEventSheetProps {
  event: TimelineEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (event: TimelineEvent) => void
  isNew?: boolean
}

export function EditTimelineEventSheet({
  event,
  open,
  onOpenChange,
  onSave,
  isNew = false,
}: EditTimelineEventSheetProps) {
  const [title, setTitle] = useState("")
  const [year, setYear] = useState(new Date().getFullYear())
  const [description, setDescription] = useState("")
  const [iconName, setIconName] = useState("Music")
  const [mediaType, setMediaType] = useState<"image" | "video">("image")
  const [mediaUrl, setMediaUrl] = useState("")
  const [customMediaPreview, setCustomMediaPreview] = useState<string | null>(null)

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setYear(event.year)
      setDescription(event.description)
      setIconName(event.iconName)
      setMediaType(event.media.type)
      setMediaUrl(event.media.url)
      setCustomMediaPreview(null)
    } else {
      // Reset for new event
      setTitle("")
      setYear(new Date().getFullYear())
      setDescription("")
      setIconName("Music")
      setMediaType("image")
      setMediaUrl("")
      setCustomMediaPreview(null)
    }
  }, [event, open])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCustomMediaPreview(url)
      setMediaUrl(url)

      // Detect media type from file
      if (file.type.startsWith("video/")) {
        setMediaType("video")
      } else {
        setMediaType("image")
      }
    }
  }

  const handleSave = () => {
    const updatedEvent: TimelineEvent = {
      id: event?.id || `event-${Date.now()}`,
      title,
      year,
      description,
      iconName,
      media: {
        type: mediaType,
        url: mediaUrl,
      },
    }
    onSave(updatedEvent)
    onOpenChange(false)
  }

  const currentYears = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-white/10 bg-zinc-950 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-white">{isNew ? "Add New Event" : "Edit Event"}</SheetTitle>
          <SheetDescription className="text-zinc-400">
            {isNew ? "Create a new milestone for your timeline." : "Update the details of this milestone."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-zinc-300">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., First Album Release"
              className="border-white/10 bg-zinc-900 text-white placeholder:text-zinc-600"
            />
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label htmlFor="year" className="text-zinc-300">
              Year
            </Label>
            <Select value={year.toString()} onValueChange={(v) => setYear(Number.parseInt(v))}>
              <SelectTrigger className="border-white/10 bg-zinc-900 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900">
                {currentYears.map((y) => (
                  <SelectItem key={y} value={y.toString()} className="text-white focus:bg-white/10">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this milestone..."
              className="min-h-[100px] border-white/10 bg-zinc-900 text-white placeholder:text-zinc-600"
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Icon</Label>
            <div className="grid grid-cols-8 gap-2">
              {ICON_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => setIconName(option.name)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                      iconName === option.name
                        ? "border-amber-500 bg-amber-500/20 text-amber-200"
                        : "border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Media</Label>
            <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as "image" | "video")}>
              <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
                <TabsTrigger value="image" className="data-[state=active]:bg-white/10">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="video" className="data-[state=active]:bg-white/10">
                  <Video className="mr-2 h-4 w-4" />
                  Video
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="mt-4 space-y-4">
                {/* Image URL Input */}
                <Input
                  value={mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value)
                    setCustomMediaPreview(null)
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="border-white/10 bg-zinc-900 text-white placeholder:text-zinc-600"
                />

                <div className="text-center text-sm text-zinc-500">or</div>

                {/* File Upload */}
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-white/20 bg-zinc-900/50 p-6 transition-colors hover:border-white/40">
                  <Upload className="h-8 w-8 text-zinc-500" />
                  <span className="text-sm text-zinc-400">Click to upload an image</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </TabsContent>

              <TabsContent value="video" className="mt-4 space-y-4">
                <Input
                  value={mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value)
                    setCustomMediaPreview(null)
                  }}
                  placeholder="https://example.com/video.mp4"
                  className="border-white/10 bg-zinc-900 text-white placeholder:text-zinc-600"
                />

                <div className="text-center text-sm text-zinc-500">or</div>

                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-white/20 bg-zinc-900/50 p-6 transition-colors hover:border-white/40">
                  <Upload className="h-8 w-8 text-zinc-500" />
                  <span className="text-sm text-zinc-400">Click to upload a video</span>
                  <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </TabsContent>
            </Tabs>

            {/* Preview */}
            {mediaUrl && (
              <div className="mt-4 overflow-hidden rounded-lg border border-white/10">
                <div className="relative aspect-video">
                  {mediaType === "image" ? (
                    <img src={customMediaPreview || mediaUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <video src={customMediaPreview || mediaUrl} className="h-full w-full object-cover" controls muted />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!title || !description}
            className="w-full bg-white text-black hover:bg-zinc-200"
          >
            {isNew ? "Add Event" : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
