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
        return { success: true, data: link }
    } catch (error) {
        console.error('Failed to update link:', error)
        return { success: false, error: 'Failed to update link' }
    }
}

export async function createLink() {
    try {
        const maxOrderLink = await prisma.link.findFirst({
            orderBy: { order: 'desc' },
        })
        const newOrder = (maxOrderLink?.order ?? 0) + 1

        const link = await prisma.link.create({
            data: {
                title: 'New Link',
                url: 'https://example.com',
                icon: 'Link',
                group: 'General',
                order: newOrder,
            },
        })
        revalidatePath('/')
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
        return { success: true }
    } catch (error) {
        console.error('Failed to delete link:', error)
        return { success: false, error: 'Failed to delete link' }
    }
}
