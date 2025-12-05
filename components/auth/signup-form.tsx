"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { signup } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" className="w-full" disabled={pending}>
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
            router.push("/login?signup=success")
        } else {
            setError(result.error || "Failed to create account")
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Sign up to create your Link in Bio</CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="johndoe"
                            required
                            pattern="[a-zA-Z0-9_-]+"
                            title="Username can only contain letters, numbers, hyphens, and underscores"
                        />
                        <p className="text-xs text-muted-foreground">
                            This will be your public URL: /u/username
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                    </div>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <SubmitButton />
                    <p className="text-sm text-muted-foreground text-center">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
