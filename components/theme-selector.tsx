"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { updateProfile } from "@/app/actions/profile"
import { Check, Layout, Film } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeSelectorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentTheme: "classic" | "cinematic"
    onSuccess?: () => void
}

const themes = [
    {
        id: "classic" as const,
        name: "Classic",
        description: "Simple, button-focused Linktree-style layout",
        icon: Layout,
        preview: {
            bgClass: "bg-neutral-900",
            features: ["Centered avatar", "Button links", "Dark card container"]
        }
    },
    {
        id: "cinematic" as const,
        name: "Cinematic",
        description: "Immersive, timeline-focused Resend-style layout",
        icon: Film,
        preview: {
            bgClass: "bg-gradient-to-b from-zinc-900 via-black to-black",
            features: ["Serif typography", "Glass cards", "Spotlight gradient"]
        }
    }
]

export function ThemeSelector({ open, onOpenChange, currentTheme, onSuccess }: ThemeSelectorProps) {
    const [selectedTheme, setSelectedTheme] = useState<"classic" | "cinematic">(currentTheme)
    const [isLoading, setIsLoading] = useState(false)

    const handleSave = async () => {
        if (selectedTheme === currentTheme) {
            onOpenChange(false)
            return
        }

        setIsLoading(true)
        try {
            const result = await updateProfile({ theme: selectedTheme })
            if (result.success) {
                onSuccess?.()
                onOpenChange(false)
            }
        } catch (error) {
            console.error("Failed to update theme:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Choose Your Theme</DialogTitle>
                    <DialogDescription>
                        Select how your public profile page will look to visitors.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2 py-4">
                    {themes.map((theme) => {
                        const Icon = theme.icon
                        const isSelected = selectedTheme === theme.id

                        return (
                            <button
                                key={theme.id}
                                onClick={() => setSelectedTheme(theme.id)}
                                className={cn(
                                    "relative rounded-xl border-2 p-4 text-left transition-all duration-200 hover:border-primary/50",
                                    isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-card hover:bg-accent/5"
                                )}
                            >
                                {/* Selection indicator */}
                                {isSelected && (
                                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <Check className="h-3 w-3" />
                                    </div>
                                )}

                                {/* Preview area */}
                                <div className={cn(
                                    "mb-4 h-24 rounded-lg flex items-center justify-center overflow-hidden",
                                    theme.preview.bgClass
                                )}>
                                    <Icon className="h-8 w-8 text-white/60" />
                                </div>

                                {/* Theme info */}
                                <div className="space-y-2">
                                    <h3 className="font-semibold">{theme.name}</h3>
                                    <p className="text-sm text-muted-foreground">{theme.description}</p>

                                    {/* Features */}
                                    <ul className="mt-3 space-y-1">
                                        {theme.preview.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Theme"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
