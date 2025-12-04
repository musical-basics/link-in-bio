import { getLinks } from "@/app/actions/links"
import { PublicProfile } from "@/components/public-profile"
import { Link } from "@/lib/data"

export default async function PublicPage() {
  const { success, data } = await getLinks()
  const links = success ? (data as Link[]) : []

  return <PublicProfile initialLinks={links} />
}
