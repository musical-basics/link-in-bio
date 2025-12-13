import { getLinks } from "@/app/actions/links"
import { getGroups } from "@/app/actions/groups"
import { PublicProfile } from "@/components/public-profile"
import { Link } from "@/lib/data"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface UserPageProps {
    params: Promise<{
        username: string
    }>
}

export default async function UserPage({ params }: UserPageProps) {
    const { username } = await params

    // Find user by username
    const user = await prisma.user.findUnique({
        where: { username },
        include: { profile: true },
    })

    if (!user || !user.profile) {
        notFound()
    }

    console.log("DEBUG: Rendering UserPage for", username)
    console.log("DEBUG: Hero Headline:", user.profile.heroHeadline)
    console.log("DEBUG: Hero Subtitle:", user.profile.heroSubtitle)
    console.log("DEBUG: Show Hero:", user.profile.showHero)

    // Get user's links and groups
    const [linksResult, groupsResult] = await Promise.all([
        getLinks(user.id),
        getGroups(user.id)
    ])

    const links = linksResult.success ? (linksResult.data as Link[]) : []
    const groups = groupsResult.success ? groupsResult.data : []

    // Transform profile data to match expected format
    const profileData = {
        username: username,
        name: user.profile.name,
        bio: user.profile.bio || "",
        imageUrl: user.profile.imageUrl || "/diverse-person-portrait.png",
        imageObjectFit: user.profile.imageObjectFit || "cover",
        imageCrop: user.profile.imageCrop as { x: number; y: number; zoom: number } | undefined,
        // Hero section fields
        heroHeadline: user.profile.heroHeadline ?? "My Story",
        heroSubtitle: user.profile.heroSubtitle ?? "Welcome to my musical journey.",
        heroVideoUrl: user.profile.heroVideoUrl || undefined,
        showHero: user.profile.showHero !== false,
        // Theme
        theme: (user.profile.theme || "classic") as "classic" | "cinematic",
        socials: user.profile.socials as any[] || [],
    }

    return <PublicProfile initialLinks={links} initialGroups={groups as any} profileData={profileData} />
}

export async function generateMetadata({ params }: UserPageProps) {
    const { username } = await params

    const user = await prisma.user.findUnique({
        where: { username },
        include: { profile: true },
    })

    if (!user || !user.profile) {
        return {
            title: 'User Not Found',
        }
    }

    return {
        title: `${user.profile.name} - Link in Bio`,
        description: user.profile.bio || `${user.profile.name}'s links`,
    }
}
