'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getGroups() {
    try {
        const groups = await prisma.group.findMany({
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
        // First try to find existing group
        const existingGroup = await prisma.group.findUnique({
            where: { name },
        })

        if (existingGroup) {
            // Update existing group
            const group = await prisma.group.update({
                where: { name },
                data: { description },
            })
            revalidatePath('/')
            return { success: true, data: group }
        } else {
            // Create new group if it doesn't exist
            const maxOrderGroup = await prisma.group.findFirst({
                orderBy: { order: 'desc' },
            })
            const group = await prisma.group.create({
                data: {
                    name,
                    description,
                    order: (maxOrderGroup?.order ?? 0) + 1,
                },
            })
            revalidatePath('/')
            return { success: true, data: group }
        }
    } catch (error) {
        console.error('Failed to update group description:', error)
        return { success: false, error: 'Failed to update group description' }
    }
}

export async function createGroup(name: string, description?: string) {
    try {
        const maxOrderGroup = await prisma.group.findFirst({
            orderBy: { order: 'desc' },
        })

        const group = await prisma.group.create({
            data: {
                name,
                description: description || null,
                order: (maxOrderGroup?.order ?? 0) + 1,
            },
        })
        revalidatePath('/')
        return { success: true, data: group }
    } catch (error) {
        console.error('Failed to create group:', error)
        return { success: false, error: 'Failed to create group' }
    }
}
