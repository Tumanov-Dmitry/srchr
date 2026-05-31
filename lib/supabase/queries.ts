import { createClient } from "@/lib/supabase/server"
import type {
  ContractorProfile,
  Material,
  Organization,
  OrganizationMember,
  TenderResponse,
} from "@/types"

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function getServices() {
  const supabase = await createClient()
  const { data } = await supabase.from("services").select("*").order("name")

  return data ?? []
}

export async function getUserOrganizationMemberships(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("organization_members")
    .select("*, organizations(*)")
    .eq("user_id", userId)

  if (!error) return (data ?? []) as OrganizationMember[]

  const { data: fallbackData } = await supabase
    .from("organization_members")
    .select("*, organizations(*)")
    .eq("profile_id", userId)

  return (fallbackData ?? []) as OrganizationMember[]
}

export async function getOnboardingState() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      memberships: [],
      isComplete: false,
      primaryRole: null,
      dashboardPath: "/login",
    }
  }

  const memberships = await getUserOrganizationMemberships(user.id)
  const organization = memberships[0]?.organizations
  const isContractor = Boolean(organization?.is_contractor)
  const isClient = Boolean(organization?.is_client)
  const primaryRole = isContractor ? "contractor" : isClient ? "client" : null

  return {
    user,
    memberships,
    isComplete: memberships.length > 0,
    primaryRole,
    dashboardPath: primaryRole === "contractor" ? "/dashboard/contractor" : "/dashboard/client",
  }
}

export async function getCurrentContractorOrganization() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      organization: null,
      profile: null,
      services: [],
    }
  }

  const memberships = await getUserOrganizationMemberships(user.id)
  const organization =
    memberships.find((membership) => membership.organizations?.is_contractor)
      ?.organizations ?? null

  if (!organization) {
    return {
      user,
      organization: null,
      profile: null,
      services: [],
    }
  }

  const supabase = await createClient()
  const { data: profile, error: profileError } = await supabase
    .from("contractor_profiles")
    .select("*")
    .eq("organization_id", organization.id)
    .maybeSingle()

  const { data: services, error: servicesError } = await supabase
    .from("organization_services")
    .select("*, services(*)")
    .eq("organization_id", organization.id)

  const { data: fallbackServices } = servicesError
    ? await supabase
        .from("organization_services")
        .select("*, services(*)")
        .eq("org_id", organization.id)
    : { data: null }

  return {
    user,
    organization,
    profile: profileError ? null : ((profile ?? null) as ContractorProfile | null),
    services: servicesError ? (fallbackServices ?? []) : (services ?? []),
  }
}

export async function getCurrentClientOrganization() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      organization: null,
    }
  }

  const memberships = await getUserOrganizationMemberships(user.id)
  const organization =
    memberships.find((membership) => membership.organizations?.is_client)
      ?.organizations ?? null

  return {
    user,
    organization,
  }
}

export async function getCurrentTenderOwnerOrganization() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      organization: null,
    }
  }

  const memberships = await getUserOrganizationMemberships(user.id)
  const organization =
    memberships.find((membership) => membership.organizations?.is_client)
      ?.organizations ??
    memberships.find((membership) => membership.organizations?.is_contractor)
      ?.organizations ??
    memberships[0]?.organizations ??
    null

  return {
    user,
    organization,
  }
}

function isMissingTable(error: { message?: string } | null) {
  const message = error?.message ?? ""
  return message.includes("Could not find the table") || message.includes("does not exist")
}

export async function getDashboardMaterials() {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user || !organization) {
    return {
      user,
      organization,
      materials: [] as Material[],
      isMaterialsTableMissing: false,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("materials")
    .select(
      "id, type, title, slug, description, cover_url, author, status, category, tags, reading_time, company_id, organization_id, created_by, created_at, updated_at, published_at",
    )
    .or(
      `company_id.eq.${organization.id},organization_id.eq.${organization.id},created_by.eq.${user.id}`,
    )
    .order("created_at", { ascending: false })

  return {
    user,
    organization,
    materials: error ? [] : ((data ?? []) as Material[]),
    isMaterialsTableMissing: isMissingTable(error),
  }
}

export async function getDashboardMaterialById(id: string) {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user || !organization) {
    return {
      user,
      organization,
      material: null,
      isMaterialsTableMissing: false,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("id", id)
    .or(
      `company_id.eq.${organization.id},organization_id.eq.${organization.id},created_by.eq.${user.id}`,
    )
    .maybeSingle()

  return {
    user,
    organization,
    material: error ? null : ((data ?? null) as Material | null),
    isMaterialsTableMissing: isMissingTable(error),
  }
}

export type ContractorFilters = {
  city?: string
  service?: string
  budget?: string
}

export async function getPublishedContractors(filters: ContractorFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from("organizations")
    .select("*, organization_services(services(*)), contractor_profiles(*)")
    .eq("is_contractor", true)
    .eq("status", "published")
    .order("name")

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`)
  }

  const { data } = await query
  const maxBudget = filters.budget ? Number(filters.budget) : null
  let contractors = (data ?? []) as Organization[]

  if (filters.service) {
    contractors = contractors.filter((contractor) =>
      contractor.organization_services?.some(
        (item) => item.service_id === filters.service,
      ),
    )
  }

  if (maxBudget && Number.isFinite(maxBudget)) {
    return contractors.filter((contractor) => {
      const profileBudget = contractor.contractor_profiles?.[0]?.min_budget
      const organizationBudget = contractor.min_budget
      const budget = profileBudget ?? organizationBudget

      return !budget || budget <= maxBudget
    })
  }

  return contractors
}

export async function getContractorBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("organizations")
    .select("*, organization_services(services(*)), contractor_profiles(*), cases(*)")
    .eq("slug", slug)
    .eq("is_contractor", true)
    .eq("status", "published")
    .single()

  return data
}

export async function getPublishedCases() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("cases")
    .select("*, organizations(*)")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  return data ?? []
}

export async function getCaseBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("cases")
    .select("*, organizations(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  return data
}

export type TenderFilters = {
  q?: string
  city?: string
  budget?: string
}

export async function getPublishedTenders(filters: TenderFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from("tenders")
    .select("*, organizations(*)")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (filters.q) {
    query = query.ilike("title", `%${filters.q}%`)
  }

  const { data } = await query
  let tenders = data ?? []

  if (filters.city) {
    const city = filters.city.toLowerCase()
    tenders = tenders.filter((tender) =>
      tender.organizations?.city?.toLowerCase().includes(city),
    )
  }

  const maxBudget = filters.budget ? Number(filters.budget) : null
  if (maxBudget && Number.isFinite(maxBudget)) {
    tenders = tenders.filter((tender) => {
      const budget = tender.budget_to ?? tender.budget ?? tender.budget_from
      return !budget || budget <= maxBudget
    })
  }

  return tenders
}

export async function getTenderBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tenders")
    .select("*, organizations(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  return data
}

export async function getClientTenders() {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user || !organization) {
    return {
      user,
      organization,
      tenders: [],
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("tenders")
    .select("*, organizations(*)")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false })

  return {
    user,
    organization,
    tenders: data ?? [],
  }
}

export async function getClientTenderById(id: string) {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user || !organization) {
    return {
      user,
      organization,
      tender: null,
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("tenders")
    .select("*, organizations(*)")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle()

  return {
    user,
    organization,
    tender: data,
  }
}

export async function getTenderResponses(tenderId: string) {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user || !organization) {
    return {
      user,
      organization,
      tender: null,
      responses: [],
    }
  }

  const supabase = await createClient()
  const { data: tender } = await supabase
    .from("tenders")
    .select("*, organizations(*)")
    .eq("id", tenderId)
    .eq("organization_id", organization.id)
    .maybeSingle()

  if (!tender) {
    return {
      user,
      organization,
      tender: null,
      responses: [],
    }
  }

  const { data: responses } = await supabase
    .from("tender_responses")
    .select("*, organizations(*)")
    .eq("tender_id", tenderId)
    .order("created_at", { ascending: false })

  return {
    user,
    organization,
    tender,
    responses: (responses ?? []) as TenderResponse[],
  }
}

export async function getContractorResponses() {
  const { user, organization } = await getCurrentContractorOrganization()

  if (!user || !organization) {
    return {
      user,
      organization,
      responses: [],
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("tender_responses")
    .select("*, tenders(*, organizations(*))")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false })

  return {
    user,
    organization,
    responses: (data ?? []) as TenderResponse[],
  }
}
