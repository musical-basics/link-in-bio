import { getLinks } from "@/app/actions/links"
import { getGroups } from "@/app/actions/groups"
import { getLinkClickCounts } from "@/app/actions/analytics"
import { AdminDashboard } from "@/components/admin-dashboard"
import { Link } from "@/lib/data"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const [linksResult, groupsResult, profile, clickCounts] = await Promise.all([
    getLinks(),
    getGroups(),
    prisma.profile.findUnique({
      where: { userId: session.user.id },
    }),
    getLinkClickCounts(),
  ])

  const rawLinks = linksResult.success ? (linksResult.data as Link[]) : []
  const links = rawLinks.map(l => ({ ...l, clicks: clickCounts[l.id] ?? 0 }))
  const groups = groupsResult.success ? groupsResult.data : []

  return <AdminDashboard
    initialLinks={links}
    initialGroups={groups as any}
    username={session.user.username}
    initialProfile={profile}
  />
}
