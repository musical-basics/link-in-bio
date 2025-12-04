import { getLinks } from "@/app/actions/links"
import { AdminDashboard } from "@/components/admin-dashboard"
import { Link } from "@/lib/data"

export default async function AdminPage() {
  const { success, data } = await getLinks()
  const links = success ? (data as Link[]) : []

  return <AdminDashboard initialLinks={links} />
}
