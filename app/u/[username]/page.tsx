import { getLinks } from "@/app/actions/links"
import { getGroups } from "@/app/actions/groups"
import { PublicProfile } from "@/components/public-profile"
import { Link } from "@/lib/data"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

interface UserPageProps {
    params: {
        username: string
    }
}

export default async function UserPage({ params }: UserPageProps) {
    const { username } = params

    // Find user by username
    const user = await prisma.user.findUnique({
        where: { username },
        include: { profile: true },
    })

    if (!user || !user.profile) {
        notFound()
    }

    // Get user's links and groups
    const [linksResult, groupsResult] = await Promise.all([
        getLinks(user.id),
        getGroups(user.id)
    ])

    const links = linksResult.success ? (linksResult.data as Link[]) : []
    const groups = groupsResult.success ? groupsResult.data : []

    // Transform profile data to match expected format
    const profileData = {
        name: user.profile.name,
        title: user.profile.bio || "Link in Bio",
        bio: user.profile.bio || "",
        image: user.profile.imageUrl || "/diverse-person-portrait.png",
        socials: user.profile.socials as any[] || [],
    }

    return <PublicProfile initialLinks={links} initialGroups={groups as any} profileData={profileData} />
}

export async function generateMetadata({ params }: UserPageProps) {
    const { username } = params

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
