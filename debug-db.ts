import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Checking users in database...")
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            email: true
        }
    })
    console.log("Found users:", JSON.stringify(users, null, 2))

    const target = "lionelyu"
    const specific = await prisma.user.findUnique({
        where: { username: target }
    })
    console.log(`Searching for '${target}':`, specific ? "Found" : "Not Found")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
