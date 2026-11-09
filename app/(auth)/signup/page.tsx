import { headers } from "next/headers"
import { SignupForm } from "@/components/auth/signup-form"
import { UpWelcomePrompt } from "@/components/auth/up-welcome-prompt"
import { isFromUltimatePianist, isUpEnabled } from "@/lib/up/config"

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const params = await searchParams
    const upEnabled = isUpEnabled()
    const fromUp =
        upEnabled &&
        isFromUltimatePianist({ from: params.from, referer: (await headers()).get("referer") })
    const upError = typeof params.up_error === "string" ? params.up_error : undefined

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            {fromUp ? <UpWelcomePrompt /> : <SignupForm upEnabled={upEnabled} upError={upError} />}
        </div>
    )
}
