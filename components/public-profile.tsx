"use client"

import type { Link as LinkType, ProfileData } from "@/lib/data"
import { ClassicTheme } from "@/components/themes/classic-theme"
import { CinematicTheme } from "@/components/themes/cinematic-theme"

interface Group {
    id: string
    name: string
    description: string | null
    order: number
}

interface PublicProfileProps {
    initialLinks: LinkType[]
    initialGroups: Group[]
    profileData: ProfileData
    /** A/B formatting style preset — see [data-ab-style] rules in globals.css */
    abStyleKey?: string | null
}

export function PublicProfile({ initialLinks, initialGroups, profileData, abStyleKey }: PublicProfileProps) {
    // Render the appropriate theme based on user's selection
    const theme = (() => {
        switch (profileData.theme) {
            case "cinematic":
                return (
                    <CinematicTheme
                        initialLinks={initialLinks}
                        initialGroups={initialGroups}
                        profileData={profileData}
                    />
                )
            case "classic":
            default:
                return (
                    <ClassicTheme
                        initialLinks={initialLinks}
                        initialGroups={initialGroups}
                        profileData={profileData}
                    />
                )
        }
    })()

    if (!abStyleKey) return theme
    return <div data-ab-style={abStyleKey}>{theme}</div>
}
