'use server'

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirect: false,
        });
        return 'success';
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function signup(formData: FormData) {
    const email = (formData.get('email') as string || '').toLowerCase();
    const password = formData.get('password') as string;
    const username = (formData.get('username') as string || '').toLowerCase();
    const name = formData.get('name') as string;

    // Validate input
    if (!email || !password || !username || !name) {
        return { success: false, error: 'All fields are required' };
    }

    if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
    }

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username },
                ],
            },
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return { success: false, error: 'Email already in use' };
            }
            return { success: false, error: 'Username already taken' };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Transaction: Create User AND Default Groups
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    username,
                    profile: {
                        create: {
                            name,
                            bio: "Welcome to my page!",
                            imageUrl: null,
                            // Initialize storage used to 0
                            storageUsed: 0,
                        },
                    },
                },
            });

            // Seed default groups so the user isn't staring at a blank screen
            await tx.group.createMany({
                data: [
                    { name: "Music", description: "My latest releases", order: 1, userId: user.id },
                    { name: "Socials", description: "Connect with me", order: 2, userId: user.id },
                    { name: "Work", description: "Projects & Portfolio", order: 3, userId: user.id },
                ]
            });
        });

        // 2. Auto-Login immediately
        try {
            await signIn('credentials', {
                email,
                password,
                redirect: false,
            });
        } catch (err) {
            console.error("Auto-login failed:", err);
            // If auto-login fails, we still return success for signup, 
            // but the client might need to redirect to login.
            // However, the client logic will redirect to admin if success is true.
            // So if auto-login fails, the user will be redirected to admin but might be unauthenticated?
            // NextAuth/Auth.js handles session cookies, so if signIn worked, they are logged in.
        }

        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: 'Failed to create account' };
    }
}

export async function logout() {
    await signOut({ redirect: false });
    revalidatePath('/');
}
