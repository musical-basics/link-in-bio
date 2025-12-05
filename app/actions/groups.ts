'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-utils'

export async function getGroups(userId?: string) {
    try {
        // If userId provided, get groups for that user (for public pages)
        // Otherwise, get groups for current authenticated user (for admin)
        const targetUserId = userId || (await requireAuth()).id

        const groups = await prisma.group.findMany({
            where: { userId: targetUserId },
            orderBy: {
                order: 'asc',
            },
        })
        return { success: true, data: groups }
    } catch (error) {
        console.error('Failed to fetch groups:', error)
        return { success: false, error: 'Failed to fetch groups' }
    }
}

export async function updateGroupDescription(name: string, description: string) {
    try {
        const user = await requireAuth()

        // First try to find existing group for this user
        const existingGroup = await prisma.group.findFirst({
            where: { name, userId: user.id },
        })

        if (existingGroup) {
            // Update existing group
            const group = await prisma.group.update({
                where: { id: existingGroup.id },
                data: { description },
            })
            revalidatePath('/')
            revalidatePath(`/u/${user.username}`)
            return { success: true, data: group }
        } else {
            // Create new group if it doesn't exist
            const maxOrderGroup = await prisma.group.findFirst({
                where: { userId: user.id },
                orderBy: { order: 'desc' },
            })
            const group = await prisma.group.create({
                data: {
                    name,
                    description,
                    order: (maxOrderGroup?.order ?? 0) + 1,
                    userId: user.id,
                },
            })
            revalidatePath('/')
            revalidatePath(`/u/${user.username}`)
            return { success: true, data: group }
        }
    } catch (error) {
        console.error('Failed to update group description:', error)
        return { success: false, error: 'Failed to update group description' }
    }
}

export async function createGroup(name: string, description?: string) {
    try {
        const user = await requireAuth()

        const maxOrderGroup = await prisma.group.findFirst({
            where: { userId: user.id },
            orderBy: { order: 'desc' },
        })

        const group = await prisma.group.create({
            data: {
                name,
                description: description || null,
                order: (maxOrderGroup?.order ?? 0) + 1,
                userId: user.id,
            },
        })
        revalidatePath('/')
        revalidatePath(`/u/${user.username}`)
        return { success: true, data: group }
    } catch (error) {
        console.error('Failed to create group:', error)
        return { success: false, error: 'Failed to create group' }
    }
}
