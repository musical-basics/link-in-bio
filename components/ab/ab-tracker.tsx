"use client"

import { useEffect } from "react"
import { usePostHog } from "posthog-js/react"

const KEY_RE = /^(\d+)([a-z])$/

/**
 * Client-side A/B instrumentation for the public bio page.
 *
 * - Registers `ab_variant` as a PostHog super property so every event this
 *   visitor fires (including the existing `link_clicked`) is tagged.
 * - Captures `ab_page_view` on mount.
 * - Captures `ab_page_leave` with `duration_seconds` + `click_count` when the
 *   page is hidden/closed (sendBeacon, once per pageview) — this feeds the
 *   time-on-page and bounce-rate metrics.
 */
export function AbTracker({ variantKey }: { variantKey: string | null }) {
    const posthog = usePostHog()

    useEffect(() => {
        if (!posthog || !variantKey) return
        const m = KEY_RE.exec(variantKey)

        posthog.register({
            ab_variant: variantKey,
            ab_format: m ? m[1] : undefined,
            ab_order: m ? m[2] : undefined,
        })
        posthog.capture("ab_page_view", { ab_variant: variantKey })

        const start = Date.now()
        let clicks = 0
        let sent = false

        const onClick = () => {
            clicks++
        }
        const sendLeave = () => {
            if (sent) return
            sent = true
            posthog.capture(
                "ab_page_leave",
                {
                    ab_variant: variantKey,
                    duration_seconds: Math.round((Date.now() - start) / 1000),
                    click_count: clicks,
                },
                { transport: "sendBeacon" },
            )
        }
        const onVisibility = () => {
            if (document.visibilityState === "hidden") sendLeave()
        }

        document.addEventListener("click", onClick, true)
        document.addEventListener("visibilitychange", onVisibility)
        window.addEventListener("pagehide", sendLeave)

        return () => {
            document.removeEventListener("click", onClick, true)
            document.removeEventListener("visibilitychange", onVisibility)
            window.removeEventListener("pagehide", sendLeave)
            sendLeave() // SPA navigation away from the bio page
        }
    }, [posthog, variantKey])

    return null
}
