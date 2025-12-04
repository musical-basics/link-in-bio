'use client'
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

export function LinkTracker() {
    const posthog = usePostHog()

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('[data-link-id]') as HTMLElement
            if (target && target.dataset.linkId) {
                posthog.capture('link_clicked', {
                    link_id: target.dataset.linkId,
                    link_url: target.getAttribute('href') || target.dataset.href,
                })
            }
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [posthog])

    return null
}
