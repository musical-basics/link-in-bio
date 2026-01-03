"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { updateTimelineLayout } from "@/app/actions/timeline"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface TimelineLayoutToggleProps {
    currentLayout: string
}

export function TimelineLayoutToggle({ currentLayout }: TimelineLayoutToggleProps) {
    const [isEditorial, setIsEditorial] = useState(currentLayout === "editorial")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleToggle = async (checked: boolean) => {
        setIsEditorial(checked)
        setIsLoading(true)
        try {
            const newLayout = checked ? "editorial" : "classic"
            await updateTimelineLayout(newLayout)
            toast.success(`Switched to ${newLayout === "editorial" ? "Editorial" : "Classic"} view`)
            router.refresh()
        } catch (error) {
            toast.error("Failed to update layout preference")
            setIsEditorial(!checked) // Revert on failure
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center space-x-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <Switch
                id="timeline-layout"
                checked={isEditorial}
                onCheckedChange={handleToggle}
                disabled={isLoading}
            />
            <Label htmlFor="timeline-layout" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-medium text-white">Editorial Mode</span>
                <span className="text-xs text-zinc-400">
                    {isEditorial ? "Using the new Zig-Zag layout" : "Using the Classic Center layout"}
                </span>
            </Label>
        </div>
    )
}
