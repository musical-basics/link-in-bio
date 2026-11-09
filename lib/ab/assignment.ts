/**
 * What the middleware does with a bio-page request's A/B state. Pure and
 * edge-safe (no prisma/node imports), so it is unit-tested directly.
 */
import {
    abRegistry,
    isActiveVariantKey,
    isKnownVariantKey,
    isTestClosed,
    pickVariantKey,
    type AbRegistry,
} from "./registry.ts"

/** Request header the middleware sets for an admin `?ab=` preview once the test is closed. */
export const AB_PREVIEW_HEADER = "x-mb-ab-preview"

export interface AbRequestState {
    /** `?ab=` value, if any */
    forced: string | null
    /** current mb_ab cookie value, if any */
    current: string | undefined
    /** logged-in session or AB_EXCLUDED_IPS match */
    isAdminViewer: boolean
}

export interface AbDecision {
    /** Variant to stamp into the mb_ab cookie (request + response), or null. */
    assign: string | null
    /** Delete an existing mb_ab cookie (test closed). */
    clearCookie: boolean
    /** Closed test only: variant to render for this one request (admin preview, no cookie). */
    previewKey: string | null
}

export function decideAb(state: AbRequestState, reg: AbRegistry = abRegistry): AbDecision {
    const { forced, current, isAdminViewer } = state

    if (isTestClosed(reg)) {
        return {
            assign: null,
            clearCookie: !!current,
            previewKey: forced && isAdminViewer && isKnownVariantKey(forced, reg) ? forced : null,
        }
    }

    // Running: forced (?ab=2b) > sticky valid cookie > fresh CSPRNG assignment.
    let assign: string | null = null
    if (forced && isKnownVariantKey(forced, reg) && forced !== current) {
        assign = forced
    } else if (!isAdminViewer && !isActiveVariantKey(current, reg)) {
        assign = pickVariantKey(reg)
    }
    return { assign, clearCookie: false, previewKey: null }
}
