import { cache } from "react"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { PublicProfile } from "@/components/public-profile"
import { AbTracker } from "@/components/ab/ab-tracker"
import { Link } from "@/lib/data"
import { prisma } from "@/lib/prisma"
import { AB_COOKIE, resolveVariant } from "@/lib/ab/registry"
import { applyLinkOrder } from "@/lib/ab/order"

export const dynamic = "force-dynamic"

interface UserPageProps {
    params: Promise<{
        username: string
    }>
}

// One DB round-trip for profile + links + groups, deduped between the page
// and generateMetadata via React cache().
const getUserPageData = cache(async (username: string) =>
    prisma.user.findFirst({
        where: {
            username: {
                equals: username,
                mode: "insensitive",
            },
        },
        include: {
            profile: true,
            links: { orderBy: { order: "asc" } },
            groups: { orderBy: { order: "asc" } },
        },
    }),
)

export default async function UserPage({ params }: UserPageProps) {
    const { username } = await params

    const [user, cookieStore] = await Promise.all([getUserPageData(username), cookies()])

    if (!user || !user.profile) {
        notFound()
    }

    // A/B variant (assigned by middleware): number = formatting, letter = link order
    const variant = resolveVariant(cookieStore.get(AB_COOKIE)?.value)
    const { links, groups } = applyLinkOrder(user.links as Link[], user.groups, variant?.order)

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
        // Theme: the format variant may override the owner's choice
        theme: (variant?.format.theme || user.profile.theme || "classic") as "classic" | "cinematic",
        socials: (user.profile.socials as any[]) || [],
    }

    return (
        <>
            <AbTracker variantKey={variant?.key ?? null} />
            <PublicProfile
                initialLinks={links}
                initialGroups={groups as any}
                profileData={profileData}
                abStyleKey={variant?.format.styleKey ?? null}
            />
        </>
    )
}

export async function generateMetadata({ params }: UserPageProps) {
    const { username } = await params
    const user = await getUserPageData(username)

    if (!user || !user.profile) {
        return {
            title: "User Not Found",
        }
    }

    return {
        title: `${user.profile.name} - Link in Bio`,
        description: user.profile.bio || `${user.profile.name}'s links`,
    }
}
