"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getTimelineEvents() {
    const session = await auth()

    if (!session?.user?.id) {
        return []
    }

    const events = await prisma.timelineEvent.findMany({
        where: { userId: session.user.id },
        orderBy: { order: "asc" },
    })

    return events
}

export async function getPublicTimelineEvents(username: string) {
    console.log("Fetching timeline events for:", username)
    const user = await prisma.user.findUnique({
        where: { username },
    })

    if (!user) {
        console.log("User not found for username:", username)
        return null
    }

    const events = await prisma.timelineEvent.findMany({
        where: { userId: user.id },
        orderBy: { order: "asc" },
        select: {
            id: true,
            title: true,
            year: true,
            description: true,
            mediaType: true, // Needed to determine if we should fetch media
            order: true,
            // Explicitly exclude mediaUrl to reduce payload size
        }
    })

    return events
}

export async function upsertTimelineEvent(data: {
    id?: string
    title: string
    year: number
    description?: string
    mediaUrl?: string
    mediaType: string
}) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    let event;
    if (data.id) {
        // Update existing event
        event = await prisma.timelineEvent.update({
            where: {
                id: data.id,
                userId: session.user.id // Ensure ownership
            },
            data: {
                title: data.title,
                year: data.year,
                description: data.description,
                mediaUrl: data.mediaUrl,
                mediaType: data.mediaType,
            },
        })
    } else {
        // Create new event
        // Get max order to append to the end
        const lastEvent = await prisma.timelineEvent.findFirst({
            where: { userId: session.user.id },
            orderBy: { order: "desc" },
        })

        const newOrder = lastEvent ? lastEvent.order + 1 : 0

        event = await prisma.timelineEvent.create({
            data: {
                title: data.title,
                year: data.year,
                description: data.description,
                mediaUrl: data.mediaUrl,
                mediaType: data.mediaType,
                order: newOrder,
                userId: session.user.id,
            },
        })
    }

    revalidatePath("/admin/timeline-builder")
    revalidatePath(`/u/${session.user.username}/story`)

    return { success: true, data: event }
}

export async function deleteTimelineEvent(id: string) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    await prisma.timelineEvent.delete({
        where: {
            id,
            userId: session.user.id // Ensure ownership
        },
    })

    revalidatePath("/admin/timeline-builder")
    revalidatePath(`/u/${session.user.username}/story`)
}

export async function reorderTimelineEvents(items: { id: string; order: number }[]) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    // Use a transaction to update all items efficiently
    await prisma.$transaction(
        items.map((item) =>
            prisma.timelineEvent.update({
                where: {
                    id: item.id,
                    userId: session.user.id
                },
                data: { order: item.order },
            })
        )
    )

    revalidatePath("/admin/timeline-builder")
    revalidatePath(`/${session.user.username}/story`)
}
