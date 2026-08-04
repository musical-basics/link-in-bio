import type { AbOrder } from "./registry"

interface OrderableLink {
    title: string
    url: string
    group: string
    order: number
    isActive: boolean
}

interface OrderableGroup {
    name: string
    order: number
}

/**
 * Apply an ordering variant server-side by rewriting the `order` fields the
 * themes already sort by. Links whose title/URL match a pin keyword are moved
 * to the top of their group, and the first pinned link's group becomes the
 * first group on the page. Relative order is otherwise preserved.
 */
export function applyLinkOrder<L extends OrderableLink, G extends OrderableGroup>(
    links: L[],
    groups: G[],
    orderVariant: AbOrder | null | undefined,
): { links: L[]; groups: G[] } {
    if (!orderVariant || orderVariant.pinKeywords.length === 0) {
        return { links, groups }
    }

    const keywords = orderVariant.pinKeywords.map((k) => k.toLowerCase())
    const matches = (l: OrderableLink) => {
        const haystack = `${l.title} ${l.url}`.toLowerCase()
        return keywords.some((k) => haystack.includes(k))
    }

    const sorted = [...links].sort((a, b) => a.order - b.order)
    const pinned = sorted.filter((l) => l.isActive !== false && matches(l))
    if (pinned.length === 0) return { links, groups }

    const rest = sorted.filter((l) => !pinned.includes(l))
    const reLinks = [...pinned, ...rest].map((l, i) => ({ ...l, order: i }))

    const firstGroup = pinned[0].group
    const sortedGroups = [...groups].sort((a, b) => a.order - b.order)
    const reGroups = [
        ...sortedGroups.filter((g) => g.name === firstGroup),
        ...sortedGroups.filter((g) => g.name !== firstGroup),
    ].map((g, i) => ({ ...g, order: i }))

    return { links: reLinks, groups: reGroups }
}
