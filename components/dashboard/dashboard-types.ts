import type {
  CompletionScore,
  ExpertProfile,
  Favorite,
  Material,
  Notification,
  Organization,
  ReputationSummary,
  Tender,
} from "@/types"
import type { DashboardStory } from "@/components/dashboard/stories-modal"

export type PresenceItem = {
  kind: "organization" | "expert"
  title: string
  status: string
  score: CompletionScore
  href: string
}

export type DashboardTender = Tender & {
  responsesCount?: number
}

export type ContractorDashboardData = {
  name: string
  presence: PresenceItem[]
  tenders: Tender[]
  materials: Material[]
  notifications: Notification[]
  reputation: ReputationSummary | null
  storyHighlights: DashboardStory[]
}

export type ClientDashboardData = {
  name: string
  organization: Organization | null
  tenders: DashboardTender[]
  recommendations: Array<{
    id: string
    type: "contractor" | "expert"
    name: string
    description?: string | null
    city?: string | null
    imageUrl?: string | null
    href: string
    tags: string[]
  }>
  favorites: Favorite[]
  notifications: Notification[]
  storyHighlights: DashboardStory[]
}

export type UniversalDashboardData = {
  email?: string | null
  expert?: ExpertProfile | null
}
