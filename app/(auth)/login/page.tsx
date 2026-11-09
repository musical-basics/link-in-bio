import { LoginForm } from "@/components/auth/login-form"
import { authSecret } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isUpEnabled } from "@/lib/up/config"
import { verifyLinkToken } from "@/lib/up/link-token"
import { loginErrorMessage } from "@/lib/auth/login-error"

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const params = await searchParams
    const upEnabled = isUpEnabled()

    // ?link=<token>: signed in with Ultimate Pianist using an email that already has
    // a Musical Bio account. Logging in with its password links the two.
    let link: { token: string; email: string } | undefined
    const token = typeof params.link === "string" ? params.link : undefined
    if (upEnabled && token) {
        const payload = verifyLinkToken(token, authSecret())
        if (payload) {
            try {
                const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true } })
                if (user) link = { token, email: user.email }
            } catch (err) {
                console.error("Link lookup failed:", err)
            }
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <LoginForm upEnabled={upEnabled} link={link} notice={loginErrorMessage(params.error) ?? undefined} />
        </div>
    )
}
