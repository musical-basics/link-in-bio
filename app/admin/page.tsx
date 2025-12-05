import { getLinks } from "@/app/actions/links"
import { getGroups } from "@/app/actions/groups"
import { AdminDashboard } from "@/components/admin-dashboard"
import { Link } from "@/lib/data"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const [linksResult, groupsResult] = await Promise.all([getLinks(), getGroups()])
  const links = linksResult.success ? (linksResult.data as Link[]) : []
  const groups = groupsResult.success ? groupsResult.data : []

  return <AdminDashboard initialLinks={links} initialGroups={groups as any} />
}

