#!/usr/bin/env node
/**
 * One-off: add a "Portfolio" link at the very bottom of musical.bio/lionelyu.
 *
 *   node scripts/add-portfolio-link.cjs           # dry run: prints the plan, writes nothing
 *   node scripts/add-portfolio-link.cjs --apply   # inserts the link
 *
 * Needs DATABASE_URL for production (e.g. `vercel env pull .env.production --environment=production`,
 * then `set -a; . ./.env.production; set +a`). The repo's .env points at the local Docker DB.
 *
 * Placement: the last group (by Group.order) that has active links, with `order` one past every
 * existing link's order. A/B "order" variants renumber links by sorting on `order` globally, so a
 * globally-largest order keeps it last in every variant. Its title/URL match no pinKeywords
 * (lib/ab/registry.ts), so no variant pins it. No other row is touched. Idempotent: if a link with
 * this URL already exists for the user, it reports it and exits.
 */
const { PrismaClient } = require("@prisma/client")

const USERNAME = "lionelyu"
const LINK = {
    title: "Portfolio",
    url: "https://lionel-yu-portfolio.vercel.app",
    icon: "Briefcase",
    layout: "classic",
    // every other link on the page has a thumbnail; this is the portfolio's own og:image
    thumbnail: "https://lionel-yu-portfolio.vercel.app/assets/images/lionel-stage.jpg",
}

async function main() {
    const apply = process.argv.includes("--apply")
    const prisma = new PrismaClient()
    try {
        const user = await prisma.user.findFirst({
            where: { username: { equals: USERNAME, mode: "insensitive" } },
            include: { links: { orderBy: { order: "asc" } }, groups: { orderBy: { order: "asc" } } },
        })
        if (!user) throw new Error(`user ${USERNAME} not found`)

        const existing = user.links.find((l) => l.url.replace(/\/$/, "") === LINK.url)
        if (existing) {
            console.log(`Already present: "${existing.title}" in "${existing.group}" (order ${existing.order}). Nothing to do.`)
            return
        }

        const active = user.links.filter((l) => l.isActive !== false)
        const groupsWithLinks = user.groups.filter((g) => active.some((l) => l.group === g.name))
        const group = groupsWithLinks[groupsWithLinks.length - 1]?.name ?? active[active.length - 1]?.group
        if (!group) throw new Error("no group with active links found")
        const order = Math.max(0, ...user.links.map((l) => l.order)) + 1

        console.log("Current links (group | order | title):")
        for (const g of user.groups) {
            for (const l of user.links.filter((x) => x.group === g.name)) {
                console.log(`  ${g.name} | ${l.order} | ${l.title}${l.isActive === false ? " (inactive)" : ""}`)
            }
        }
        console.log(`\nPlan: add "${LINK.title}" -> ${LINK.url} in "${group}" with order ${order}.`)

        if (!apply) {
            console.log("Dry run. Re-run with --apply to write.")
            return
        }
        const created = await prisma.link.create({ data: { ...LINK, group, order, userId: user.id } })
        console.log(`Created link ${created.id}.`)
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((e) => {
    console.error(e.message || e)
    process.exit(1)
})
