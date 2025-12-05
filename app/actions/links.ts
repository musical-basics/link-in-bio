'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-utils'

export async function getLinks(userId?: string) {
    try {
        // If userId provided, get links for that user (for public pages)
        // Otherwise, get links for current authenticated user (for admin)
        const targetUserId = userId || (await requireAuth()).id

        const links = await prisma.link.findMany({
            where: { userId: targetUserId },
            orderBy: {
                order: 'asc',
            },
        })
        return { success: true, data: links }
    } catch (error) {
        console.error('Failed to fetch links:', error)
        return { success: false, error: 'Failed to fetch links' }
    }
}

export async function updateLink(id: string, data: any) {
    try {
        const user = await requireAuth()

        // Verify link belongs to user before updating
        const link = await prisma.link.findFirst({
            where: { id, userId: user.id },
        })

        if (!link) {
            return { success: false, error: 'Link not found or unauthorized' }
        }

        const updatedLink = await prisma.link.update({
            where: { id },
            data,
        })
        revalidatePath('/')
        revalidatePath('/admin')
        revalidatePath(`/u/${user.username}`)
        return { success: true, data: updatedLink }
    } catch (error) {
        console.error('Failed to update link:', error)
        return { success: false, error: 'Failed to update link' }
    }
}

export async function createLink(linkData: {
    title: string
    subtitle: string
    url: string
    icon: string
    group: string
}) {
    try {
        const user = await requireAuth()

        // Shift all existing links for this user down by 1
        await prisma.link.updateMany({
            where: { userId: user.id },
            data: {
                order: {
                    increment: 1,
                },
            },
        })

        const link = await prisma.link.create({
            data: {
                title: linkData.title,
                subtitle: linkData.subtitle || null,
                url: linkData.url,
                icon: linkData.icon,
                group: linkData.group,
                order: 0,
                userId: user.id,
            },
        })
        revalidatePath('/')
        revalidatePath('/admin')
        revalidatePath(`/u/${user.username}`)
        return { success: true, data: link }
    } catch (error) {
        console.error('Failed to create link:', error)
        return { success: false, error: 'Failed to create link' }
    }
}

export async function deleteLink(id: string) {
    try {
        const user = await requireAuth()

        // Verify link belongs to user before deleting
        const link = await prisma.link.findFirst({
            where: { id, userId: user.id },
        })

        if (!link) {
            return { success: false, error: 'Link not found or unauthorized' }
        }

        await prisma.link.delete({
            where: { id },
        })
        revalidatePath('/')
        revalidatePath('/admin')
        revalidatePath(`/u/${user.username}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to delete link:', error)
        return { success: false, error: 'Failed to delete link' }
    }
}
