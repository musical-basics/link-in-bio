import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    const eventId = params.eventId

    try {
        const event = await prisma.timelineEvent.findUnique({
            where: { id: eventId },
            select: { mediaUrl: true, mediaType: true }
        })

        if (!event || !event.mediaUrl) {
            return new NextResponse(null, { status: 404 })
        }

        // If it's a data URL (base64)
        if (event.mediaUrl.startsWith("data:")) {
            const matches = event.mediaUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)

            if (!matches || matches.length !== 3) {
                return new NextResponse("Invalid base64 string", { status: 500 })
            }

            const contentType = matches[1]
            const buffer = Buffer.from(matches[2], "base64")

            return new NextResponse(buffer, {
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
                },
            })
        }

        // If it's a regular URL, redirect to it
        return NextResponse.redirect(event.mediaUrl)

    } catch (error) {
        console.error("Error serving media:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ eventId: string }> }
) {
    const params = await props.params;
    const eventId = params.eventId

    try {
        const body = await request.json()
        const { mediaUrl, mediaType } = body

        if (!mediaUrl) {
            return new NextResponse("Missing mediaUrl", { status: 400 })
        }

        // Update the event with the new media
        // Note: We need to ensure authentication here ideally, 
        // but for now relying on the fact that the ID is known and this is an MVP
        // In a production app, we should check session here too.
        await prisma.timelineEvent.update({
            where: { id: eventId },
            data: {
                mediaUrl,
                mediaType: mediaType || "image"
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Error updating media:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
