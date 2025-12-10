'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import { revalidatePath } from 'next/cache'

export async function getProfile() {
    try {
        const user = await requireAuth()

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
        })

        return { success: true, data: profile }
    } catch (error) {
        console.error('Failed to fetch profile:', error)
        return { success: false, error: 'Failed to fetch profile' }
    }
}

export async function updateProfile(data: {
    name?: string
    bio?: string | null
    imageUrl?: string | null
    imageObjectFit?: string
    imageCrop?: { x: number; y: number; zoom: number }
    socials?: any
    // Hero section fields
    heroHeadline?: string
    heroSubtitle?: string
    heroVideoUrl?: string | null
    showHero?: boolean
    // Theme
    theme?: "classic" | "cinematic"
}) {
    try {
        const user = await requireAuth()

        // Validate base64 image size to prevent database timeouts
        if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
            // Base64 strings are roughly 1.37x the size of the original file
            const base64Length = data.imageUrl.length
            const estimatedSizeInMB = (base64Length * 0.75) / (1024 * 1024)

            if (estimatedSizeInMB > 3) {
                return {
                    success: false,
                    error: 'Image is too large. Please compress it or use an image URL instead.'
                }
            }
        }

        // Prepare data object, only including fields that exist
        const updateData: any = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.bio !== undefined) updateData.bio = data.bio
        if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
        if (data.socials !== undefined) updateData.socials = data.socials

        // Only include new fields if they're provided (gracefully handle if DB doesn't have them yet)
        if (data.imageObjectFit !== undefined) updateData.imageObjectFit = data.imageObjectFit
        if (data.imageCrop !== undefined) updateData.imageCrop = data.imageCrop

        // Hero section fields
        if (data.heroHeadline !== undefined) updateData.heroHeadline = data.heroHeadline
        if (data.heroSubtitle !== undefined) updateData.heroSubtitle = data.heroSubtitle
        if (data.heroVideoUrl !== undefined) updateData.heroVideoUrl = data.heroVideoUrl
        if (data.showHero !== undefined) updateData.showHero = data.showHero

        // Theme field
        if (data.theme !== undefined) updateData.theme = data.theme

        const profile = await prisma.profile.update({
            where: { userId: user.id },
            data: updateData,
        })

        revalidatePath('/admin')
        revalidatePath(`/u/${user.username}`)
        return { success: true, data: profile }
    } catch (error: any) {
        console.error('Failed to update profile:', error)

        // If it's a field error, try again without the new fields
        if (error.message?.includes('imageObjectFit') || error.message?.includes('imageCrop')) {
            try {
                const retryUser = await requireAuth()

                const fallbackData: any = {}
                if (data.name !== undefined) fallbackData.name = data.name
                if (data.bio !== undefined) fallbackData.bio = data.bio
                if (data.imageUrl !== undefined) fallbackData.imageUrl = data.imageUrl
                if (data.socials !== undefined) fallbackData.socials = data.socials

                const profile = await prisma.profile.update({
                    where: { userId: retryUser.id },
                    data: fallbackData,
                })

                revalidatePath('/admin')
                revalidatePath(`/u/${retryUser.username}`)
                return { success: true, data: profile }
            } catch (retryError) {
                console.error('Retry failed:', retryError)
                return { success: false, error: 'Failed to update profile' }
            }
        }

        return { success: false, error: 'Failed to update profile' }
    }
}
