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
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;
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

        // Create user and profile
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username,
                profile: {
                    create: {
                        name,
                        bio: null,
                        imageUrl: null,
                        socials: null,
                    },
                },
            },
        });

        revalidatePath('/login');
        return { success: true, data: user };
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: 'Failed to create account' };
    }
}

export async function logout() {
    await signOut({ redirect: false });
    revalidatePath('/');
}
