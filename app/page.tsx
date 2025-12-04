import { getLinks } from "@/app/actions/links"
import { getGroups } from "@/app/actions/groups"
import { PublicProfile } from "@/components/public-profile"
import { Link } from "@/lib/data"

export default async function PublicPage() {
  const [linksResult, groupsResult] = await Promise.all([getLinks(), getGroups()])
  const links = linksResult.success ? (linksResult.data as Link[]) : []
  const groups = groupsResult.success ? groupsResult.data : []

  return <PublicProfile initialLinks={links} initialGroups={groups as any} />
}

