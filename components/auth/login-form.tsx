"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { authenticate } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" className="w-full" disabled={pending}>
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
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Enter your credentials to access your dashboard</CardDescription>
            </CardHeader>
            <form action={dispatch}>
                <CardContent className="space-y-4">
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
                    </div>
                    {errorMessage && errorMessage !== 'success' && (
                        <p className="text-sm text-destructive">{errorMessage}</p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <SubmitButton />
                    <p className="text-sm text-muted-foreground text-center">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
