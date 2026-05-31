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
