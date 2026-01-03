"use client"

import { useFormState, useFormStatus } from "react-dom"
import { authenticate } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-zinc-200 font-medium h-11 rounded-md"
            disabled={pending}
        >
            {pending ? "Signing in..." : "Sign In"}
        </Button>
    )
}

export function LoginForm() {
    const router = useRouter()
    const [errorMessage, dispatch] = useFormState(authenticate, undefined)

    useEffect(() => {
        if (errorMessage === 'success') {
            router.push('/admin')
            router.refresh()
        }
    }, [errorMessage, router])

    return (
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl shadow-black/50 w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-white mb-2">Welcome Back</h1>
                <p className="text-zinc-400 text-sm">Enter your credentials to access your dashboard</p>
            </div>

            <form action={dispatch} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-300 text-sm">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white/20 focus:ring-0 rounded-md h-11"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-300 text-sm">Password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white/20 focus:ring-0 rounded-md h-11"
                    />
                </div>

                {errorMessage && errorMessage !== 'success' && (
                    <p className="text-sm text-destructive text-center">{errorMessage}</p>
                )}

                <SubmitButton />

                {/* Footer */}
                <p className="text-center text-zinc-400 text-sm mt-6">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-white hover:underline">
                        Sign up
                    </Link>
                </p>
            </form>
        </div>
    )
}
