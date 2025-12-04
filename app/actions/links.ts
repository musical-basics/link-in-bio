'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getLinks() {
    try {
        const links = await prisma.link.findMany({
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
        const link = await prisma.link.update({
            where: { id },
            data,
        })
        revalidatePath('/')
        revalidatePath('/admin')
        return { success: true, data: link }
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
        // Shift all existing links down by 1
        await prisma.link.updateMany({
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
            },
        })
        revalidatePath('/')
        revalidatePath('/admin')
        return { success: true, data: link }
    } catch (error) {
        console.error('Failed to create link:', error)
        return { success: false, error: 'Failed to create link' }
    }
}

export async function deleteLink(id: string) {
    try {
        await prisma.link.delete({
            where: { id },
        })
        revalidatePath('/')
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete link:', error)
        return { success: false, error: 'Failed to delete link' }
    }
}

