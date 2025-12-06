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
    socials?: any
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

        const profile = await prisma.profile.update({
            where: { userId: user.id },
            data,
        })

        revalidatePath('/admin')
        revalidatePath(`/u/${user.username}`)
        return { success: true, data: profile }
    } catch (error) {
        console.error('Failed to update profile:', error)
        return { success: false, error: 'Failed to update profile' }
    }
}
