"use client"

import { useFormStatus } from "react-dom"
import { Piano } from "lucide-react"
import { signInWithUltimatePianist } from "@/app/actions/auth"
import { cn } from "@/lib/utils"

function Inner({ label, variant }: { label: string; variant: "primary" | "outline" }) {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className={cn(
                "w-full min-h-11 px-4 py-2.5 rounded-md text-sm font-medium inline-flex items-center justify-center gap-2.5 text-center transition-colors disabled:opacity-60",
                variant === "primary"
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "border border-zinc-700 bg-zinc-950/50 text-white hover:bg-zinc-800/70 hover:border-zinc-600",
            )}
        >
            <Piano className="size-4 shrink-0" aria-hidden />
            <span>{pending ? "Opening Ultimate Pianist…" : label}</span>
        </button>
    )
}

/** Starts "Sign in with Ultimate Pianist". Render only when the provider is configured. */
export function UltimatePianistButton({
    label = "Sign in with your Ultimate Pianist account",
    variant = "outline",
}: {
    label?: string
    variant?: "primary" | "outline"
}) {
    return (
        <form action={signInWithUltimatePianist}>
            <Inner label={label} variant={variant} />
        </form>
    )
}

export function OrDivider() {
    return (
        <div className="flex items-center gap-3 my-6" aria-hidden>
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-xs uppercase tracking-wider text-zinc-500">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
        </div>
    )
}
