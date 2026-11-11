import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { OIDCConfig } from 'next-auth/providers';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getUpConfig, UP_DEFAULT_ISSUER, UP_PROVIDER_ID, UP_SCOPES, type UpConfig } from '@/lib/up/config';
import { normalizeUpProfile } from '@/lib/up/profile';
import { gatherUpClaims } from '@/lib/up/userinfo';
import { resolveUpSignIn, findLinkedUserId, sessionUser } from '@/lib/up/accounts';

async function getUser(email: string) {
    try {
        const cleanEmail = email.trim().toLowerCase();
        const user = await prisma.user.findFirst({
            where: {
                email: {
                    equals: cleanEmail,
                    mode: 'insensitive'
                }
            },
            include: { profile: true },
        });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export function authSecret(): string {
    return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';
}

/**
 * "Sign in with your Ultimate Pianist account": Ultimate Pianist's Clerk is an
 * OpenID Connect provider. Only registered when its client id and secret are set.
 */
function UltimatePianist(config: UpConfig): OIDCConfig<Record<string, unknown>> {
    return {
        id: UP_PROVIDER_ID,
        name: 'Ultimate Pianist',
        type: 'oidc',
        issuer: config.issuer,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authorization: { params: { scope: UP_SCOPES } },
        checks: ['pkce', 'state', 'nonce'],
        profile(claims) {
            return {
                id: String(claims.sub),
                email: typeof claims.email === 'string' ? claims.email : '',
                name: typeof claims.name === 'string' ? claims.name : null,
                image: typeof claims.picture === 'string' ? claims.picture : null,
                username: '',
            };
        },
    };
}

const upConfig = getUpConfig();

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    session: { strategy: 'jwt' },
    providers: [
        Credentials({
            async authorize(credentials) {
                console.log("1. Authorize called with:", credentials?.email);

                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) {
                        console.log("2. User not found in DB");
                        return null;
                    }
                    if (!user.password) {
                        // Created through Ultimate Pianist sign-in: no password to check.
                        console.log("2. User has no password (Ultimate Pianist account)");
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) {
                        console.log("3. Password match! Returning user.");
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.profile?.name || user.username,
                            username: user.username,
                        };
                    } else {
                        console.log("3. Password Mismatch");
                    }
                } else {
                    console.log("1. Invalid Input format");
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
        ...(upConfig ? [UltimatePianist(upConfig)] : []),
    ],
    callbacks: {
        async signIn({ account, profile }) {
            if (account?.provider !== UP_PROVIDER_ID) return true;
            try {
                // The ID token can leave out the photo, name or username; userinfo fills the gaps.
                const { claims, log } = await gatherUpClaims({
                    idClaims: { ...profile },
                    sub: account.providerAccountId,
                    accessToken: account.access_token,
                    issuer: upConfig?.issuer ?? UP_DEFAULT_ISSUER,
                });
                const upProfile = normalizeUpProfile(claims);
                const outcome = await resolveUpSignIn(prisma, upProfile, authSecret());
                // Claim names and booleans only: never values or tokens.
                console.log('Ultimate Pianist sign-in:', JSON.stringify({
                    ...log,
                    outcome: outcome.kind,
                    photo: !!upProfile.imageUrl,
                    photoBackfilled: outcome.kind === 'linked' ? outcome.photoBackfilled : undefined,
                }));
                switch (outcome.kind) {
                    case 'linked':
                    case 'created':
                        return true;
                    case 'needs-password':
                        // No session yet: logging in with their password links the accounts.
                        return `/login?link=${encodeURIComponent(outcome.linkToken)}`;
                    case 'no-email':
                        return '/signup?up_error=no-email';
                }
            } catch (error) {
                console.error('Ultimate Pianist sign-in failed:', error);
                return '/signup?up_error=failed';
            }
        },
        async jwt({ token, user, account }) {
            if (account?.provider === UP_PROVIDER_ID) {
                // `user` here is Ultimate Pianist's; swap in the linked Musical Bio user.
                const userId = await findLinkedUserId(prisma, account.providerAccountId);
                const mbUser = userId ? await sessionUser(prisma, userId) : null;
                if (!mbUser) return null;
                token.sub = mbUser.id;
                token.id = mbUser.id;
                token.username = mbUser.username;
                token.email = mbUser.email;
                token.name = mbUser.profile?.name || mbUser.username;
                delete token.picture;
                return token;
            }
            if (user) {
                token.id = user.id;
                token.username = (user as any).username;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
            }
            return session;
        },
    },
});
