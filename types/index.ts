export type AccountRole = "guest" | "contractor" | "client" | "admin"
export type OnboardingRole = "contractor" | "client"

export type Organization = {
  id: string
  slug: string
  name: string
  description?: string | null
  logo_url?: string | null
  website_url?: string | null
  city?: string | null
  website?: string | null
  email?: string | null
  phone?: string | null
  min_budget?: number | null
  status?: string | null
  is_contractor?: boolean | null
  is_client?: boolean | null
  created_at?: string | null
  updated_at?: string | null
  organization_services?: Array<{
    service_id?: string | null
    services?: Service | null
  }>
  contractor_profiles?: ContractorProfile[]
}

export type ContractorProfile = {
  id?: string
  organization_id?: string | null
  org_id?: string | null
  short_description?: string | null
  full_description?: string | null
  description?: string | null
  website_url?: string | null
  min_budget?: number | null
  price_description?: string | null
  team_size?: number | null
  contact_email?: string | null
  contact_phone?: string | null
  telegram_url?: string | null
  status?: string | null
}

export type ExpertProfile = {
  id: string
  user_id: string
  slug: string
  avatar_url?: string | null
  first_name: string
  last_name?: string | null
  position?: string | null
  short_description?: string | null
  city?: string | null
  specializations?: string | null
  skills?: string | null
  activity_areas?: string | null
  experience_description?: string | null
  experience_years?: number | null
  telegram_url?: string | null
  contact_email?: string | null
  website_url?: string | null
  linkedin_url?: string | null
  behance_url?: string | null
  dribbble_url?: string | null
  is_public?: boolean | null
  is_open_to_work?: boolean | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  organizations?: Organization[]
}

export type OrganizationMember = {
  id?: string
  organization_id?: string | null
  org_id?: string | null
  user_id?: string | null
  profile_id?: string | null
  role?: string | null
  organizations?: Organization | null
}

export type Service = {
  id: string
  name: string
  slug?: string | null
}

export type Material = {
  id: string
  type: "case" | "article"
  title: string
  slug: string
  description?: string | null
  cover_url?: string | null
  author?: string | null
  status?: string | null
  category?: string | null
  tags?: string | null
  reading_time?: number | null
  content?: string | Record<string, unknown> | null
  company_id?: string | null
  organization_id?: string | null
  owner_type?: "company" | "expert" | null
  expert_id?: string | null
  created_by?: string | null
  created_at?: string | null
  updated_at?: string | null
  published_at?: string | null
  organizations?: Organization | null
  expert_profiles?: ExpertProfile | null
}

export type FavoriteTargetType = "company" | "expert" | "case" | "article"
export type FavoriteStatus = "active" | "unavailable"

export type FavoriteSnapshot = {
  title: string
  subtitle?: string | null
  image?: string | null
  description?: string | null
  object_type: FavoriteTargetType
}

export type Favorite = {
  id: string
  user_id: string
  target_type: FavoriteTargetType
  target_id: string
  is_pinned: boolean
  pinned_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  snapshot: FavoriteSnapshot
  status: FavoriteStatus
  href?: string | null
}

export type Tender = {
  id: string
  slug: string
  title: string
  description?: string | null
  goal?: string | null
  budget?: number | null
  budget_from?: number | null
  budget_to?: number | null
  deadline?: string | null
  status?: string | null
  organization_id?: string | null
  created_by?: string | null
  created_at?: string | null
  published_at?: string | null
  organizations?: Organization | null
}

export type TenderResponse = {
  id: string
  tender_id?: string | null
  organization_id?: string | null
  user_id?: string | null
  expert_id?: string | null
  responder_type?: "contractor" | "expert" | null
  message?: string | null
  status?: string | null
  created_at?: string | null
  tenders?: Tender | null
  organizations?: Organization | null
}

export type EventOwnerType = "expert" | "organization"
export type EventType =
  | "conference"
  | "meetup"
  | "webinar"
  | "workshop"
  | "education"
  | "exhibition"
  | "private_meeting"
  | "other"
export type EventFormat = "online" | "offline" | "hybrid"
export type EventPriceType = "free" | "paid"
export type EventStatus =
  | "draft"
  | "moderation"
  | "published"
  | "rejected"
  | "archived"
  | "cancelled"
  | "completed"
export type EventParticipationStatus = "going" | "interested" | "not_going"

export type Event = {
  id: string
  title: string
  slug: string
  description?: string | null
  cover_url?: string | null
  event_type: EventType
  start_date?: string | null
  end_date?: string | null
  city?: string | null
  address?: string | null
  format: EventFormat
  external_url?: string | null
  price_type: EventPriceType
  price_note?: string | null
  owner_type: EventOwnerType
  owner_id: string
  speakers?: string | null
  tags?: string | null
  categories?: string | null
  status: EventStatus
  is_promoted?: boolean | null
  promoted_until?: string | null
  promotion_url?: string | null
  created_by?: string | null
  created_at?: string | null
  updated_at?: string | null
  published_at?: string | null
  owner_name?: string | null
  owner_avatar?: string | null
  my_participation?: EventParticipationStatus | null
}

export type EventParticipant = {
  id: string
  event_id: string
  user_id: string
  status: EventParticipationStatus
  created_at?: string | null
  updated_at?: string | null
  events?: Event | null
}

export type NotificationChannel = "in_app" | "email" | "telegram"
export type NotificationSeverity = "info" | "warning" | "error" | "critical"
export type NotificationEventStatus = "new" | "processing" | "handled" | "ignored"

export type NotificationEvent = {
  id: string
  event_key: string
  event_type?: string | null
  source?: string | null
  actor_id?: string | null
  target_type?: string | null
  target_id?: string | null
  title?: string | null
  text?: string | null
  severity: NotificationSeverity
  status: NotificationEventStatus
  payload?: Record<string, unknown> | null
  created_at?: string | null
}

export type Notification = {
  id: string
  recipient_id: string
  title: string
  text?: string | null
  type: string
  target_type?: string | null
  target_id?: string | null
  target_url?: string | null
  channels?: NotificationChannel[] | null
  is_read: boolean
  created_at?: string | null
  read_at?: string | null
}

export type NotificationPreference = {
  id?: string
  user_id: string
  category: string
  event_key: string
  in_app: boolean
  email: boolean
  telegram: boolean
  created_at?: string | null
  updated_at?: string | null
}
