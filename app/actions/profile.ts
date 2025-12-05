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
    bio?: string
    imageUrl?: string
    socials?: any
}) {
    try {
        const user = await requireAuth()

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
