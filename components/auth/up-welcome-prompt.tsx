import Link from "next/link"
import { UltimatePianistButton } from "@/components/auth/ultimate-pianist-button"

/**
 * Shown on /signup to visitors who arrived from Ultimate Pianist
 * (?from=ultimatepianist, or an ultimatepianist.com referrer).
 */
export function UpWelcomePrompt() {
    return (
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl shadow-black/50 w-full max-w-md">
            <div className="text-center mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-4">Welcome from Ultimate Pianist</p>
                <h1 className="font-serif text-3xl text-white mb-3 text-balance">
                    Create your Musical Bio from your Ultimate Pianist account?
                </h1>
                <p className="text-zinc-400 text-sm text-pretty">
                    We&apos;ll start your page with your name, username and photo from Ultimate Pianist.
                    You can change anything before you share it.
                </p>
            </div>

            <UltimatePianistButton label="Yes, create my Musical Bio" variant="primary" />

            <Link
                href="/signup"
                className="mt-3 w-full min-h-11 px-4 py-2.5 rounded-md text-sm font-medium inline-flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
            >
                No thanks
            </Link>

            <p className="text-center text-zinc-500 text-xs mt-6">
                Already have a Musical Bio?{" "}
                <Link href="/login" className="text-zinc-300 hover:text-white hover:underline">
                    Sign in
                </Link>
            </p>
        </div>
    )
}
