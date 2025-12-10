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
}

export function PublicProfile({ initialLinks, initialGroups, profileData }: PublicProfileProps) {
    // Render the appropriate theme based on user's selection
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
}
