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
