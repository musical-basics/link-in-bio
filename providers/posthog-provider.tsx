'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

// Initialize at module load (not in a useEffect): child components' effects
// run BEFORE a parent's effect, so an effect-based init silently dropped any
// capture()/register() calls made from children on their first mount (this
// broke A/B variant tagging on link_clicked and ab_page_view events).
if (typeof window !== 'undefined' && !posthog.__loaded) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (key) {
        posthog.init(key, {
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
            person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
            capture_pageview: false // Disable automatic pageview capture, as we capture manually
        })
    }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    return (
        <PHProvider client={posthog}>
            {children}
        </PHProvider>
    )
}
