export interface Link {
  id: string
  title: string
  subtitle: string
  url: string
  icon: string
  group: string
  clicks: number
  order: number
}

export interface ProfileData {
  name: string
  bio: string
  imageUrl: string
  imageObjectFit?: string
  imageCrop?: { x: number; y: number; zoom: number }
  socials: {
    icon: string
    url: string
    label: string
  }[]
}

export interface Group {
  name: string
  description: string
}

export const groups: Group[] = [
  { name: "Work", description: "Professional and creative projects" },
  { name: "Socials", description: "Connect with me on social platforms" },
  { name: "Music", description: "My music and performances" },
  { name: "General", description: "Other links" },
]

// Mock data
export const profileData: ProfileData = {
  name: "Alex Morgan",
  bio: "Designer, Developer & Creator",
  imageUrl: "/diverse-person-portrait.png",
  socials: [
    { icon: "Instagram", url: "https://instagram.com/alexmorgan", label: "Instagram" },
    { icon: "Youtube", url: "https://youtube.com/@alexmorgan", label: "YouTube" },
    { icon: "Twitter", url: "https://twitter.com/alexmorgan", label: "Twitter" },
  ],
}

export const linksData: Link[] = [
  {
    id: "1",
    title: "Portfolio Website",
    subtitle: "View my latest work",
    url: "https://example.com/portfolio",
    icon: "Globe",
    group: "Work",
    clicks: 0,
    order: 1,
  },
  {
    id: "2",
    title: "Latest Blog Post",
    subtitle: "Building modern web apps",
    url: "https://example.com/blog",
    icon: "FileText",
    group: "Work",
    clicks: 0,
    order: 2,
  },
  {
    id: "3",
    title: "YouTube Channel",
    subtitle: "Subscribe for tutorials",
    url: "https://youtube.com/@example",
    icon: "Youtube",
    group: "Socials",
    clicks: 0,
    order: 3,
  },
  {
    id: "4",
    title: "Twitter / X",
    subtitle: "@alexmorgan",
    url: "https://twitter.com/example",
    icon: "Twitter",
    group: "Socials",
    clicks: 0,
    order: 4,
  },
  {
    id: "5",
    title: "Instagram",
    subtitle: "@alexcreates",
    url: "https://instagram.com/example",
    icon: "Instagram",
    group: "Socials",
    clicks: 0,
    order: 5,
  },
  {
    id: "6",
    title: "Latest Single",
    subtitle: "Now on Spotify",
    url: "https://spotify.com/track/example",
    icon: "Music",
    group: "Music",
    clicks: 0,
    order: 6,
  },
  {
    id: "7",
    title: "Apple Music",
    subtitle: "Stream my album",
    url: "https://music.apple.com/example",
    icon: "Headphones",
    group: "Music",
    clicks: 0,
    order: 7,
  },
]
