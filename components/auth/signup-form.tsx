"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { signup } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-zinc-200 font-medium h-11 rounded-md"
            disabled={pending}
        >
            {pending ? "Creating account..." : "Create Account"}
        </Button>
    )
}

export function SignupForm() {
    const router = useRouter()
    const [error, setError] = useState("")

    async function handleSubmit(formData: FormData) {
        setError("")
        const result = await signup(formData)

        if (result.success) {
            router.push("/admin")
            router.refresh()
        } else {
            setError(result.error || "Failed to create account")
        }
    }

    return (
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl shadow-black/50 w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl text-white mb-2">Create Account</h1>
                <p className="text-zinc-400 text-sm">Sign up to create your Link in Bio</p>
            </div>

            <form action={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-zinc-300 text-sm">Name</Label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white/20 focus:ring-0 rounded-md h-11"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username" className="text-zinc-300 text-sm">Username</Label>
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="johndoe"
                        required
                        pattern="[a-zA-Z0-9_-]+"
                        title="Username can only contain letters, numbers, hyphens, and underscores"
                        className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-white/20 focus:ring-0 rounded-md h-11"
                    />
                    <p className="text-zinc-600 text-xs">
                        This will be your public URL: /u/username
                    </p>
                </div>
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
                    <p className="text-zinc-600 text-xs">Must be at least 6 characters</p>
                </div>

                {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <SubmitButton />

                {/* Footer */}
                <p className="text-center text-zinc-400 text-sm mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-white hover:underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </div>
    )
}
