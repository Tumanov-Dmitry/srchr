export type AccountRole = "guest" | "contractor" | "client" | "both" | "admin"
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

export type CaseItem = {
  id: string
  slug: string
  title: string
  cover_url?: string | null
  short_description?: string | null
  content?: string | null
  status?: string | null
  organization_id?: string | null
  organizations?: Organization | null
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
  message?: string | null
  status?: string | null
  created_at?: string | null
  tenders?: Tender | null
  organizations?: Organization | null
}
