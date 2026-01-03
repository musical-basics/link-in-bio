import { EditorialTimeline } from "@/components/timeline/editorial-timeline"
import { TimelineFeed } from "@/components/timeline-feed"
import { getPublicTimelineEvents } from "@/app/actions/timeline"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import { prisma } from "@/lib/prisma"

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function StoryPage({ params }: PageProps) {
  const { username } = await params
  const session = await auth()
  const isOwner = session?.user?.username === username

  // Fetch events and user/profile in parallel or optimized way
  // Since we need profile for the setting, we fetch user including profile
  const user = await prisma.user.findUnique({
    where: { username },
    include: { profile: true }
  })

  if (!user) {
    notFound()
  }

  const events = await getPublicTimelineEvents(username)

  if (!events) {
    notFound()
  }

  // Cast events to any as we know the shape matches both components (mostly)
  // Or map them if needed. Both components expect similar structures now.
  // EditorialTimeline expects 'year: number'
  // TimelineFeed (updated) expects 'year: number'

  const layout = user.profile?.timelineLayout || "editorial"

  return (
    <div className="relative min-h-screen bg-black">
      {/* admin navigation for owner */}
      {isOwner && (
        <div className="fixed top-4 left-4 z-50 flex gap-2">
          <Link href="/admin">
            <Button variant="secondary" size="sm" className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
          <Link href="/admin/timeline-builder">
            <Button variant="secondary" size="sm" className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/10">
              <Edit className="mr-2 h-4 w-4" />
              Timeline Editor
            </Button>
          </Link>
        </div>
      )}

      {/* Stage Spotlight Effect */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/50 via-zinc-900/20 to-transparent" />

      {layout === "editorial" ? (
        <EditorialTimeline events={events} />
      ) : (
        <TimelineFeed events={events} />
      )}
    </div>
  )
}
