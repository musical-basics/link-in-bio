export interface TimelineEvent {
  id: string
  year: number
  title: string
  description: string
  iconName: string
  media: {
    type: "image" | "video"
    url: string
  }
}

export const defaultTimelineEvents: TimelineEvent[] = [
  {
    id: "first-keys-2008",
    year: 2008,
    title: "The First Keys",
    description: "Touching a piano for the first time. A moment that changed everything.",
    iconName: "Music",
    media: {
      type: "image",
      url: "/young-pianist-first-piano-lesson.jpg",
    },
  },
  {
    id: "talent-show-2012",
    year: 2012,
    title: "The Talent Show",
    description: "First public performance. My hands were shaking, but the music was clear.",
    iconName: "Mic",
    media: {
      type: "image",
      url: "/talent-show-stage-performance.jpg",
    },
  },
  {
    id: "youtube-debut-2018",
    year: 2018,
    title: "YouTube Debut",
    description: "Uploaded the first cover. 100 views felt like a million.",
    iconName: "Youtube",
    media: {
      type: "image",
      url: "/youtube-video-streaming-music-production.jpg",
    },
  },
  {
    id: "million-subscribers-2021",
    year: 2021,
    title: "1 Million Subscribers",
    description: "The Silver Play Button arrived. A symbol of a dream realized.",
    iconName: "Award",
    media: {
      type: "image",
      url: "/award-trophy-success-celebration.jpg",
    },
  },
  {
    id: "carnegie-hall-2024",
    year: 2024,
    title: "Carnegie Hall",
    description: "A dream realized. Sold out crowd. Standing ovation. Tears of joy.",
    iconName: "MapPin",
    media: {
      type: "image",
      url: "/carnegie-hall-concert-grand-piano-performance.jpg",
    },
  },
]
