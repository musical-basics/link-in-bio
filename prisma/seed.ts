import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const linksData = [
    {
        title: "Portfolio Website",
        subtitle: "View my latest work",
        url: "https://example.com/portfolio",
        icon: "Globe",
        group: "Work",
        clicks: 0,
        order: 1,
        isActive: true,
    },
    {
        title: "Latest Blog Post",
        subtitle: "Building modern web apps",
        url: "https://example.com/blog",
        icon: "FileText",
        group: "Work",
        clicks: 0,
        order: 2,
        isActive: true,
    },
    {
        title: "YouTube Channel",
        subtitle: "Subscribe for tutorials",
        url: "https://youtube.com/@example",
        icon: "Youtube",
        group: "Socials",
        clicks: 0,
        order: 3,
        isActive: true,
    },
    {
        title: "Twitter / X",
        subtitle: "@alexmorgan",
        url: "https://twitter.com/example",
        icon: "Twitter",
        group: "Socials",
        clicks: 0,
        order: 4,
        isActive: true,
    },
    {
        title: "Instagram",
        subtitle: "@alexcreates",
        url: "https://instagram.com/example",
        icon: "Instagram",
        group: "Socials",
        clicks: 0,
        order: 5,
        isActive: true,
    },
    {
        title: "Latest Single",
        subtitle: "Now on Spotify",
        url: "https://spotify.com/track/example",
        icon: "Music",
        group: "Music",
        clicks: 0,
        order: 6,
        isActive: true,
    },
    {
        title: "Apple Music",
        subtitle: "Stream my album",
        url: "https://music.apple.com/example",
        icon: "Headphones",
        group: "Music",
        clicks: 0,
        order: 7,
        isActive: true,
    },
]

async function main() {
    console.log('Start seeding...')

    // Clear existing data
    await prisma.link.deleteMany()

    for (const link of linksData) {
        const createdLink = await prisma.link.create({
            data: link,
        })
        console.log(`Created link with id: ${createdLink.id}`)
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
