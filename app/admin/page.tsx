import { getLinks } from "@/app/actions/links"
import { getGroups } from "@/app/actions/groups"
import { AdminDashboard } from "@/components/admin-dashboard"
import { Link } from "@/lib/data"

export default async function AdminPage() {
  const [linksResult, groupsResult] = await Promise.all([getLinks(), getGroups()])
  const links = linksResult.success ? (linksResult.data as Link[]) : []
  const groups = groupsResult.success ? groupsResult.data : []

  return <AdminDashboard initialLinks={links} initialGroups={groups as any} />
}

