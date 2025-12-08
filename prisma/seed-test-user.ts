import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const TEST_EMAIL = 'test@example.com'
const TEST_PASSWORD = 'TestPass123!'
const TEST_USERNAME = 'testuser'

async function main() {
    console.log('Creating test user...')

    // Hash the password
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10)

    // Delete existing test user if exists
    await prisma.user.deleteMany({
        where: {
            OR: [
                { email: TEST_EMAIL },
                { username: TEST_USERNAME }
            ]
        }
    })

    // Create test user with profile
    const user = await prisma.user.create({
        data: {
            email: TEST_EMAIL,
            password: hashedPassword,
            username: TEST_USERNAME,
            profile: {
                create: {
                    name: 'Test User',
                    bio: 'This is a test account for development.',
                    heroHeadline: 'Welcome!',
                    heroSubtitle: 'Testing the link-in-bio app.',
                    showHero: true,
                }
            }
        },
        include: { profile: true }
    })

    console.log('Test user created successfully!')
    console.log('---')
    console.log('Login Credentials:')
    console.log(`  Email: ${TEST_EMAIL}`)
    console.log(`  Password: ${TEST_PASSWORD}`)
    console.log('---')
    console.log(`  Username: ${user.username}`)
    console.log(`  Profile URL: /${user.username}`)
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
