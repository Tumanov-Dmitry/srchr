import { createClient } from "@/lib/supabase/server"
import type {
  ContractorProfile,
  ExpertProfile,
  Favorite,
  FavoriteTargetType,
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
    dashboardPath:
      primaryRole === "contractor"
        ? "/dashboard/contractor"
        : "/dashboard/client",
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
    profile: profileError
      ? null
      : ((profile ?? null) as ContractorProfile | null),
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
  return (
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  )
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

export type ExpertFilters = {
  q?: string
  specialization?: string
  city?: string
  skills?: string
  company?: string
  open?: string
}

export async function getCurrentExpertProfile() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      profile: null,
      organizations: [] as OrganizationMember[],
      isExpertTableMissing: false,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expert_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  return {
    user,
    profile: error ? null : ((data ?? null) as ExpertProfile | null),
    organizations: await getUserOrganizationMemberships(user.id),
    isExpertTableMissing: isMissingTable(error),
  }
}

export async function getPublishedExperts(filters: ExpertFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from("expert_profiles")
    .select("*")
    .eq("is_public", true)
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`)
  }

  if (filters.specialization) {
    query = query.ilike("specializations", `%${filters.specialization}%`)
  }

  if (filters.skills) {
    query = query.ilike("skills", `%${filters.skills}%`)
  }

  if (filters.open === "true") {
    query = query.eq("is_open_to_work", true)
  }

  if (filters.q) {
    query = query.or(
      `first_name.ilike.%${filters.q}%,last_name.ilike.%${filters.q}%,position.ilike.%${filters.q}%,specializations.ilike.%${filters.q}%`,
    )
  }

  const { data, error } = await query
  if (isMissingTable(error)) return []

  let experts = (data ?? []) as ExpertProfile[]

  if (filters.company) {
    const company = filters.company.toLowerCase()
    const expertsWithOrganizations = await Promise.all(
      experts.map(async (expert) => ({
        ...expert,
        organizations: (await getUserOrganizationMemberships(expert.user_id))
          .map((membership) => membership.organizations)
          .filter((organization): organization is Organization =>
            Boolean(organization),
          ),
      })),
    )

    experts = expertsWithOrganizations.filter((expert) =>
      expert.organizations?.some((organization) =>
        organization.name.toLowerCase().includes(company),
      ),
    )
  }

  return experts
}

export async function getPublishedExpertBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expert_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .eq("status", "published")
    .maybeSingle()

  if (isMissingTable(error) || !data) return null

  const profile = data as ExpertProfile
  const memberships = await getUserOrganizationMemberships(profile.user_id)
  const organizations = memberships
    .map((membership) => membership.organizations)
    .filter((organization): organization is Organization =>
      Boolean(organization),
    )

  return {
    ...profile,
    organizations,
  } as ExpertProfile
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
    .select(
      "*, organization_services(services(*)), contractor_profiles(*), cases(*)",
    )
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

export type MaterialFilters = {
  q?: string
  type?: string
  category?: string
}

export async function getPublishedMaterials(filters: MaterialFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from("materials")
    .select("*, organizations:organization_id(*)")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (filters.type === "case" || filters.type === "article") {
    query = query.eq("type", filters.type)
  }

  if (filters.category) {
    query = query.ilike("category", `%${filters.category}%`)
  }

  if (filters.q) {
    query = query.or(
      `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`,
    )
  }

  const { data } = await query

  return (data ?? []) as Material[]
}

export async function getPublishedMaterialBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("materials")
    .select("*, organizations:organization_id(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  return (data ?? null) as Material | null
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

export async function getUserFavorites(type?: string | null) {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      favorites: [] as Favorite[],
      isFavoritesTableMissing: false,
    }
  }

  const {
    hydrateFavorites,
    favoritePluralTypeMap,
    normalizeFavoriteTypeFilter,
  } = await import("@/lib/favorites")

  const supabase = await createClient()
  const normalizedType = normalizeFavoriteTypeFilter(type)
  const targetType = favoritePluralTypeMap[normalizedType]
  let query = supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .order("is_pinned", { ascending: false })
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (targetType) {
    query = query.eq("target_type", targetType)
  }

  const { data, error } = await query

  if (isMissingTable(error)) {
    return {
      user,
      favorites: [] as Favorite[],
      isFavoritesTableMissing: true,
    }
  }

  const favorites = await hydrateFavorites(supabase, (data ?? []) as Favorite[])

  return {
    user,
    favorites,
    isFavoritesTableMissing: false,
  }
}

export async function getFavoriteMarkers(
  targets: Array<{ targetType: FavoriteTargetType; targetId: string }>,
) {
  const user = await getCurrentUser()

  if (!user || targets.length === 0) return new Map<string, string>()

  const supabase = await createClient()
  const orFilter = targets
    .map(
      ({ targetType, targetId }) =>
        `and(target_type.eq.${targetType},target_id.eq.${targetId})`,
    )
    .join(",")

  const { data, error } = await supabase
    .from("favorites")
    .select("id, target_type, target_id")
    .eq("user_id", user.id)
    .or(orFilter)

  if (isMissingTable(error) || error) return new Map<string, string>()

  return new Map(
    (data ?? []).map((favorite) => [
      `${favorite.target_type}:${favorite.target_id}`,
      favorite.id as string,
    ]),
  )
}
