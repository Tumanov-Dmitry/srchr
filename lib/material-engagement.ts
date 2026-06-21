export const materialReactionOptions = [
  { key: "insightful", emoji: "💡", label: "Интересно" },
  { key: "useful", emoji: "👍", label: "Полезно" },
  { key: "wow", emoji: "🤩", label: "Впечатляет" },
  { key: "love", emoji: "❤️", label: "Нравится" },
  { key: "applause", emoji: "👏", label: "Браво" },
] as const

export type MaterialReactionKey =
  (typeof materialReactionOptions)[number]["key"]

export type MaterialComment = {
  id: string
  body: string
  created_at: string
  author: {
    name: string
    avatar_url: string | null
  }
}

export type MaterialEngagementState = {
  comments: MaterialComment[]
  reactionCounts: Record<MaterialReactionKey, number>
  currentReaction: MaterialReactionKey | null
  isAuthenticated: boolean
  isAvailable: boolean
}
