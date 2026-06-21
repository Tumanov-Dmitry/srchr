import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { reportServerError } from "@/lib/security/errors"
import {
  calculateExpertCompletion,
  calculateOrganizationCompletion,
} from "@/lib/profile-completion"
import type {
  ContractorProfile,
  ContentOwner,
  ExpertProfile,
  Favorite,
  FavoriteCollection,
  FavoriteTargetType,
  Event,
  EventParticipant,
  EventParticipationStatus,
  Material,
  Organization,
  OrganizationMember,
  ReputationBreakdown,
  ReputationEvent,
  ReputationSummary,
  ReputationTargetType,
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

export async function getMaterialClientOptions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, logo_url, slug")
    .eq("status", "published")
    .order("name")

  if (error) {
    reportServerError("materials.clientOptions", error)
    return []
  }

  return (data ?? []) as Organization[]
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

  const supabase = await createClient()
  const [memberships, { data: expertProfile, error: expertError }] =
    await Promise.all([
      getUserOrganizationMemberships(user.id),
      supabase
        .from("expert_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ])
  const hasContractor = memberships.some(
    (membership) => membership.organizations?.is_contractor,
  )
  const hasClient = memberships.some(
    (membership) => membership.organizations?.is_client,
  )
  const hasExpert = !isMissingTable(expertError) && Boolean(expertProfile)
  const primaryRole = hasContractor
    ? "contractor"
    : hasClient
      ? "client"
      : hasExpert
        ? "expert"
        : null

  return {
    user,
    memberships,
    expertProfile: (expertProfile ?? null) as ExpertProfile | null,
    isComplete: memberships.length > 0 || hasExpert,
    primaryRole,
    dashboardPath:
      primaryRole === "contractor"
        ? "/dashboard/contractor"
        : primaryRole === "client"
          ? "/dashboard/client"
          : "/dashboard/expert",
  }
}

export async function getProfileCompletionState() {
  const state = await getOnboardingState()
  if (!state.user) {
    return {
      expert: null,
      organizations: [],
    }
  }

  const supabase = await createClient()
  const expert = state.expertProfile
  const organizationIds = state.memberships
    .map(
      (membership) =>
        membership.organization_id ??
        membership.org_id ??
        membership.organizations?.id,
    )
    .filter((id): id is string => Boolean(id))

  const [{ data: expertMaterials }, { data: organizationMaterials }] =
    await Promise.all([
      expert
        ? supabase
            .from("materials")
            .select("type")
            .eq("expert_id", expert.id)
            .eq("status", "published")
        : Promise.resolve({ data: [] }),
      organizationIds.length > 0
        ? supabase
            .from("materials")
            .select("type, organization_id, company_id")
            .or(
              `organization_id.in.(${organizationIds.join(",")}),company_id.in.(${organizationIds.join(",")})`,
            )
            .eq("status", "published")
        : Promise.resolve({ data: [] }),
    ])

  const expertScore = expert
    ? calculateExpertCompletion(expert, {
        cases: (expertMaterials ?? []).filter((item) => item.type === "case")
          .length,
        articles: (expertMaterials ?? []).filter(
          (item) => item.type === "article",
        ).length,
      })
    : null

  const organizations = await Promise.all(
    state.memberships
      .filter((membership) => membership.organizations)
      .map(async (membership) => {
        const organization = membership.organizations as Organization
        const organizationId = organization.id
        const [{ count: servicesCount }, { count: membersCount }] =
          await Promise.all([
            supabase
              .from("organization_services")
              .select("*", { count: "exact", head: true })
              .eq("organization_id", organizationId),
            supabase
              .from("organization_members")
              .select("*", { count: "exact", head: true })
              .eq("organization_id", organizationId),
          ])
        const cases = (organizationMaterials ?? []).filter(
          (item) =>
            item.type === "case" &&
            (item.organization_id === organizationId ||
              item.company_id === organizationId),
        ).length

        return {
          organization,
          score: calculateOrganizationCompletion(organization, {
            services: servicesCount ?? 0,
            cases,
            members: membersCount ?? 0,
          }),
        }
      }),
  )

  return {
    expert: expert ? { profile: expert, score: expertScore } : null,
    organizations,
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

export async function getUserContentOwners(): Promise<{
  user: Awaited<ReturnType<typeof getCurrentUser>>
  owners: ContentOwner[]
}> {
  const user = await getCurrentUser()
  if (!user) return { user: null, owners: [] }

  const [memberships, expert] = await Promise.all([
    getUserOrganizationMemberships(user.id),
    getCurrentExpertProfile(),
  ])
  const owners: ContentOwner[] = []

  if (expert.profile) {
    owners.push({
      owner_type: "expert",
      owner_id: expert.profile.id,
      label:
        [expert.profile.first_name, expert.profile.last_name]
          .filter(Boolean)
          .join(" ") || "Эксперт",
    })
  }

  for (const membership of memberships) {
    if (!["owner", "admin", "editor"].includes(membership.role ?? "member")) {
      continue
    }

    const organizationId =
      membership.organization_id ??
      membership.org_id ??
      membership.organizations?.id

    if (!organizationId) continue

    owners.push({
      owner_type: "organization",
      owner_id: organizationId,
      label: membership.organizations?.name ?? "Организация",
    })
  }

  return { user, owners }
}

export async function getUserTenderOrganizations() {
  const user = await getCurrentUser()
  if (!user) return { user: null, organizations: [] as Organization[] }

  const memberships = await getUserOrganizationMemberships(user.id)
  const organizations = memberships
    .map((membership) => membership.organizations)
    .filter((organization): organization is Organization =>
      Boolean(organization),
    )

  return { user, organizations }
}

function isMissingTable(error: { message?: string } | null) {
  const message = error?.message ?? ""
  return (
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  )
}

function postgrestPattern(value: string) {
  return `"%${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}%"`
}

async function getPublicOrganizationsForUsers(userIds: string[]) {
  const result = new Map<string, Organization[]>()
  if (userIds.length === 0) return result

  try {
    const supabase = createAdminClient()
    for (const userColumn of ["user_id", "profile_id"]) {
      const { data, error } = await supabase
        .from("organization_members")
        .select(`${userColumn}, organizations(*)`)
        .in(userColumn, userIds)

      if (error) continue

      for (const membership of data ?? []) {
        const row = membership as unknown as Record<string, unknown>
        const userId = row[userColumn] as string | null
        const organization = row.organizations as Organization | null

        if (!userId || !organization || organization.status !== "published") {
          continue
        }

        const current = result.get(userId) ?? []
        if (!current.some((item) => item.id === organization.id)) {
          result.set(userId, [...current, organization])
        }
      }
    }
  } catch {
    return result
  }

  return result
}

export async function getDashboardMaterials() {
  const { user, owners } = await getUserContentOwners()

  if (!user) {
    return {
      user,
      owners,
      materials: [] as Material[],
      isMaterialsTableMissing: false,
    }
  }

  const supabase = await createClient()
  const organizationIds = owners
    .filter((owner) => owner.owner_type === "organization")
    .map((owner) => owner.owner_id)
  const ownerFilters = [`created_by.eq.${user.id}`]

  for (const organizationId of organizationIds) {
    ownerFilters.push(`organization_id.eq.${organizationId}`)
    ownerFilters.push(`company_id.eq.${organizationId}`)
  }

  const { data, error } = await supabase
    .from("materials")
    .select(
      "id, type, title, slug, description, cover_url, author, status, category, tags, reading_time, company_id, organization_id, owner_type, expert_id, created_by, created_at, updated_at, published_at",
    )
    .or(ownerFilters.join(","))
    .order("created_at", { ascending: false })

  return {
    user,
    owners,
    materials: error ? [] : ((data ?? []) as Material[]),
    isMaterialsTableMissing: isMissingTable(error),
  }
}

export async function getDashboardMaterialById(id: string) {
  const { user, owners } = await getUserContentOwners()

  if (!user) {
    return {
      user,
      owners,
      material: null,
      isMaterialsTableMissing: false,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  return {
    user,
    owners,
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
  sort?: string
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

  const { data, error } = await query
  if (isMissingTable(error)) return []
  if (error) reportServerError("experts.catalog", error)

  let experts = (data ?? []) as ExpertProfile[]

  if (filters.company || filters.q) {
    const organizationsByUser = await getPublicOrganizationsForUsers(
      experts.map((expert) => expert.user_id),
    )
    experts = experts.map((expert) => ({
      ...expert,
      organizations: organizationsByUser.get(expert.user_id) ?? [],
    }))
  }

  if (filters.company) {
    const company = filters.company.toLowerCase()
    experts = experts.filter((expert) =>
      expert.organizations?.some((organization) =>
        organization.name.toLowerCase().includes(company),
      ),
    )
  }

  if (filters.q) {
    const search = filters.q.toLowerCase()
    experts = experts.filter((expert) =>
      [
        expert.first_name,
        expert.last_name,
        expert.position,
        expert.specializations,
        ...(expert.organizations?.map((organization) => organization.name) ??
          []),
      ].some((item) => item?.toLowerCase().includes(search)),
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
  const organizationsByUser = await getPublicOrganizationsForUsers([
    profile.user_id,
  ])
  const organizations = organizationsByUser.get(profile.user_id) ?? []
  const [{ data: ownedMaterials }, { data: authoredRows }] = await Promise.all([
    supabase
      .from("materials")
      .select("*, organizations:organization_id(*)")
      .eq("status", "published")
      .eq("owner_type", "expert")
      .eq("expert_id", profile.id),
    supabase
      .from("material_expert_authors")
      .select("materials(*)")
      .eq("expert_id", profile.id),
  ])
  const materialsById = new Map<string, Material>()

  for (const material of (ownedMaterials ?? []) as Material[]) {
    materialsById.set(material.id, material)
  }

  for (const row of authoredRows ?? []) {
    const material = row.materials as unknown as Material | null
    if (material?.status === "published")
      materialsById.set(material.id, material)
  }

  return {
    ...profile,
    organizations,
    materials: [...materialsById.values()],
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

  const { data, error } = await query
  if (error) reportServerError("contractors.catalog", error)
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
    .select("*, organization_services(services(*)), contractor_profiles(*)")
    .eq("slug", slug)
    .eq("is_contractor", true)
    .eq("status", "published")
    .maybeSingle()

  if (!data) return null

  const { data: materials } = await supabase
    .from("materials")
    .select(
      "id, type, title, slug, description, cover_url, status, organization_id, company_id, published_at, created_at",
    )
    .eq("type", "case")
    .eq("status", "published")
    .or(`organization_id.eq.${data.id},company_id.eq.${data.id}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  return {
    ...data,
    materials: (materials ?? []) as Material[],
  }
}

export async function getReputationSummaries(
  targetType: ReputationTargetType,
  targetIds: string[],
) {
  const uniqueTargetIds = [...new Set(targetIds.filter(Boolean))]
  const summaries = new Map<string, ReputationSummary>()

  if (uniqueTargetIds.length === 0) return summaries

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("reputation_summary")
    .select("*")
    .eq("target_type", targetType)
    .in("target_id", uniqueTargetIds)

  if (error) {
    if (!isMissingTable(error)) {
      reportServerError("queries.getReputationSummaries", error)
    }

    return summaries
  }

  for (const summary of (data ?? []) as ReputationSummary[]) {
    summaries.set(summary.target_id, summary)
  }

  return summaries
}

export async function getReputationSummary(
  targetType: ReputationTargetType,
  targetId: string,
) {
  const summaries = await getReputationSummaries(targetType, [targetId])
  return summaries.get(targetId) ?? null
}

export async function getReputationBreakdowns(
  targets: Array<{ targetType: ReputationTargetType; targetId: string }>,
) {
  const breakdowns = new Map<string, ReputationBreakdown[]>()
  const supabase = await createClient()

  await Promise.all(
    targets.map(async ({ targetType, targetId }) => {
      const key = `${targetType}:${targetId}`
      const { data, error } = await supabase
        .from("reputation_breakdown")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("category")

      if (error) {
        if (!isMissingTable(error)) {
          reportServerError("queries.getReputationBreakdowns", error)
        }
        breakdowns.set(key, [])
        return
      }

      breakdowns.set(key, (data ?? []) as ReputationBreakdown[])
    }),
  )

  return breakdowns
}

export async function getReputationDetails(
  targetType: ReputationTargetType,
  targetId: string,
) {
  const [summary, breakdowns] = await Promise.all([
    getReputationSummary(targetType, targetId),
    getReputationBreakdowns([{ targetType, targetId }]),
  ])

  return {
    summary,
    breakdown: breakdowns.get(`${targetType}:${targetId}`) ?? [],
  }
}

export async function getDashboardReputation() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      targets: [],
      isReputationTableMissing: false,
    }
  }

  const [memberships, expertState] = await Promise.all([
    getUserOrganizationMemberships(user.id),
    getCurrentExpertProfile(),
  ])
  const targetDefinitions: Array<{
    targetType: ReputationTargetType
    targetId: string
    name: string
    href: string
  }> = []

  for (const membership of memberships) {
    const organization = membership.organizations
    if (!organization?.is_contractor) continue
    if (
      targetDefinitions.some(
        (target) =>
          target.targetType === "contractor" &&
          target.targetId === organization.id,
      )
    ) {
      continue
    }

    targetDefinitions.push({
      targetType: "contractor",
      targetId: organization.id,
      name: organization.name,
      href: `/contractors/${organization.slug}`,
    })
  }

  if (expertState.profile) {
    const profile = expertState.profile
    targetDefinitions.push({
      targetType: "expert",
      targetId: profile.id,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
      href: `/@${profile.slug}`,
    })
  }

  const supabase = await createClient()
  const summaries = await Promise.all(
    targetDefinitions.map(async (target) => {
      const [{ summary, breakdown }, { data: events, error }] =
        await Promise.all([
          getReputationDetails(target.targetType, target.targetId),
          supabase
            .from("reputation_events")
            .select("*")
            .eq("target_type", target.targetType)
            .eq("target_id", target.targetId)
            .order("created_at", { ascending: false })
            .limit(30),
        ])

      return {
        ...target,
        summary,
        breakdown,
        events: error ? [] : ((events ?? []) as ReputationEvent[]),
        isMissing: isMissingTable(error),
      }
    }),
  )

  return {
    user,
    targets: summaries,
    isReputationTableMissing: summaries.some((target) => target.isMissing),
  }
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

export type EventFilters = {
  month?: string
  city?: string
  format?: string
  event_type?: string
  tag?: string
}

function eventOwnerName(
  event: Event,
  organizations: Organization[],
  experts: ExpertProfile[],
) {
  if (event.owner_type === "organization") {
    return (
      organizations.find((organization) => organization.id === event.owner_id)
        ?.name ?? null
    )
  }

  const expert = experts.find((profile) => profile.id === event.owner_id)
  return expert
    ? [expert.first_name, expert.last_name].filter(Boolean).join(" ")
    : null
}

async function hydrateEventOwners(events: Event[]) {
  if (events.length === 0) return events

  const supabase = await createClient()
  const organizationIds = events
    .filter((event) => event.owner_type === "organization")
    .map((event) => event.owner_id)
  const expertIds = events
    .filter((event) => event.owner_type === "expert")
    .map((event) => event.owner_id)

  const [{ data: organizations }, { data: experts }] = await Promise.all([
    organizationIds.length > 0
      ? supabase
          .from("organizations")
          .select("id, name, logo_url")
          .in("id", organizationIds)
      : Promise.resolve({ data: [] }),
    expertIds.length > 0
      ? supabase
          .from("expert_profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", expertIds)
      : Promise.resolve({ data: [] }),
  ])

  return events.map((event) => ({
    ...event,
    owner_name: eventOwnerName(
      event,
      (organizations ?? []) as Organization[],
      (experts ?? []) as ExpertProfile[],
    ),
  }))
}

export async function getPublishedEvents(filters: EventFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from("events")
    .select("*")
    .in("status", ["published", "completed"])
    .order("is_promoted", { ascending: false })
    .order("promoted_until", { ascending: false, nullsFirst: false })
    .order("start_date", { ascending: true })

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`)
  }

  if (
    filters.format &&
    ["online", "offline", "hybrid"].includes(filters.format)
  ) {
    query = query.eq("format", filters.format)
  }

  if (filters.event_type) {
    query = query.eq("event_type", filters.event_type)
  }

  if (filters.tag) {
    const pattern = postgrestPattern(filters.tag)
    query = query.or(`tags.ilike.${pattern},categories.ilike.${pattern}`)
  }

  if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) {
    const start = `${filters.month}-01T00:00:00.000Z`
    const end = new Date(start)
    end.setUTCMonth(end.getUTCMonth() + 1)
    query = query.gte("start_date", start).lt("start_date", end.toISOString())
  }

  const { data, error } = await query
  if (isMissingTable(error)) return []
  if (error) reportServerError("events.catalog", error)

  return hydrateEventOwners((data ?? []) as Event[])
}

export async function getPublishedEventBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .in("status", ["published", "completed"])
    .maybeSingle()

  if (isMissingTable(error) || !data) return null

  const [event] = await hydrateEventOwners([data as Event])
  const user = await getCurrentUser()

  if (!user) return event

  const { data: participation } = await supabase
    .from("event_participants")
    .select("status")
    .eq("event_id", event.id)
    .eq("user_id", user.id)
    .maybeSingle()

  return {
    ...event,
    my_participation: (participation?.status ??
      null) as EventParticipationStatus | null,
  }
}

export async function getDashboardEvents() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      events: [] as Event[],
      participations: [] as EventParticipant[],
      isEventsTableMissing: false,
    }
  }

  const memberships = await getUserOrganizationMemberships(user.id)
  const organizationIds = memberships
    .filter((membership) =>
      ["owner", "admin", "editor"].includes(membership.role ?? "member"),
    )
    .map(
      (membership) =>
        membership.organization_id ?? membership.organizations?.id,
    )
    .filter((id): id is string => Boolean(id))

  const expert = await getCurrentExpertProfile()
  const ownerFilters = [`created_by.eq.${user.id}`]

  if (expert.profile) {
    ownerFilters.push(
      `and(owner_type.eq.expert,owner_id.eq.${expert.profile.id})`,
    )
  }

  for (const organizationId of organizationIds) {
    ownerFilters.push(
      `and(owner_type.eq.organization,owner_id.eq.${organizationId})`,
    )
  }

  const supabase = await createClient()
  const [
    { data, error },
    { data: participationData, error: participationError },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .or(ownerFilters.join(","))
      .order("created_at", { ascending: false }),
    supabase
      .from("event_participants")
      .select("*, events(*)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ])

  return {
    user,
    events: error ? [] : await hydrateEventOwners((data ?? []) as Event[]),
    participations: participationError
      ? []
      : ((participationData ?? []) as EventParticipant[]),
    isEventsTableMissing:
      isMissingTable(error) || isMissingTable(participationError),
  }
}

export async function getDashboardEventById(id: string) {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      event: null,
      isEventsTableMissing: false,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (isMissingTable(error)) {
    return {
      user,
      event: null,
      isEventsTableMissing: true,
    }
  }

  if (!data) {
    return {
      user,
      event: null,
      isEventsTableMissing: false,
    }
  }

  const [event] = await hydrateEventOwners([data as Event])

  return {
    user,
    event,
    isEventsTableMissing: false,
  }
}

export async function getPublishedMaterials(filters: MaterialFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from("materials")
    .select("*, organizations:organization_id(*), expert_profiles:expert_id(*)")
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
    const pattern = postgrestPattern(filters.q)
    query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`)
  }

  const { data, error } = await query
  if (error) reportServerError("materials.catalog", error)

  return (data ?? []) as Material[]
}

export async function getPublishedMaterialBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("materials")
    .select("*, organizations:organization_id(*), expert_profiles:expert_id(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (error) reportServerError("materials.publicBySlug", error)
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

  const { data, error } = await query
  if (error) reportServerError("tenders.catalog", error)
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
  const { data, error } = await supabase
    .from("tenders")
    .select("*, organizations(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (error) reportServerError("tenders.publicBySlug", error)
  return data
}

export async function getClientTenders() {
  const { user, organizations } = await getUserTenderOrganizations()

  if (!user || organizations.length === 0) {
    return {
      user,
      organizations,
      tenders: [],
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("tenders")
    .select("*, organizations(*)")
    .in(
      "organization_id",
      organizations.map((organization) => organization.id),
    )
    .order("created_at", { ascending: false })

  return {
    user,
    organizations,
    tenders: data ?? [],
  }
}

export async function getClientTenderById(id: string) {
  const { user, organizations } = await getUserTenderOrganizations()

  if (!user || organizations.length === 0) {
    return {
      user,
      organizations,
      tender: null,
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("tenders")
    .select("*, organizations(*)")
    .eq("id", id)
    .in(
      "organization_id",
      organizations.map((organization) => organization.id),
    )
    .maybeSingle()

  return {
    user,
    organizations,
    tender: data,
  }
}

export async function getTenderResponses(tenderId: string) {
  const { user, organizations } = await getUserTenderOrganizations()

  if (!user || organizations.length === 0) {
    return {
      user,
      organizations,
      tender: null,
      responses: [],
    }
  }

  const supabase = await createClient()
  const { data: tender } = await supabase
    .from("tenders")
    .select("*, organizations(*)")
    .eq("id", tenderId)
    .in(
      "organization_id",
      organizations.map((organization) => organization.id),
    )
    .maybeSingle()

  if (!tender) {
    return {
      user,
      organizations,
      tender: null,
      responses: [],
    }
  }

  const { data: responses } = await supabase
    .from("tender_responses")
    .select("*, organizations(*), expert_profiles:expert_id(*)")
    .eq("tender_id", tenderId)
    .order("created_at", { ascending: false })

  return {
    user,
    organizations,
    tender,
    responses: (responses ?? []) as TenderResponse[],
  }
}

export async function getUserTenderResponses() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      responses: [] as TenderResponse[],
    }
  }

  const [memberships, expert] = await Promise.all([
    getUserOrganizationMemberships(user.id),
    getCurrentExpertProfile(),
  ])
  const organizationIds = memberships
    .map(
      (membership) =>
        membership.organization_id ??
        membership.org_id ??
        membership.organizations?.id,
    )
    .filter((id): id is string => Boolean(id))
  const filters = [`user_id.eq.${user.id}`]

  for (const organizationId of organizationIds) {
    filters.push(`organization_id.eq.${organizationId}`)
  }

  if (expert.profile?.id) {
    filters.push(`expert_id.eq.${expert.profile.id}`)
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("tender_responses")
    .select(
      "*, tenders(*, organizations(*)), organizations(*), expert_profiles:expert_id(*)",
    )
    .or(filters.join(","))
    .order("created_at", { ascending: false })

  return {
    user,
    responses: (data ?? []) as TenderResponse[],
  }
}

export async function getUserFavorites(
  type?: string | null,
  collectionId?: string | null,
) {
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

  if (collectionId) {
    const { data: collectionItems } = await supabase
      .from("favorite_collection_items")
      .select("favorite_id, favorite_collections!inner(user_id)")
      .eq("collection_id", collectionId)
      .eq("favorite_collections.user_id", user.id)

    const favoriteIds = (collectionItems ?? []).map((item) => item.favorite_id)
    if (favoriteIds.length === 0) {
      return {
        user,
        favorites: [] as Favorite[],
        isFavoritesTableMissing: false,
      }
    }
    query = query.in("id", favoriteIds)
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
  const favoriteIds = favorites.map((favorite) => favorite.id)
  const { data: collectionItems } =
    favoriteIds.length > 0
      ? await supabase
          .from("favorite_collection_items")
          .select("favorite_id, collection_id")
          .in("favorite_id", favoriteIds)
      : { data: [] }
  const collectionMap = new Map<string, string[]>()
  for (const item of collectionItems ?? []) {
    const current = collectionMap.get(item.favorite_id) ?? []
    current.push(item.collection_id)
    collectionMap.set(item.favorite_id, current)
  }

  return {
    user,
    favorites: favorites.map((favorite) => ({
      ...favorite,
      collection_ids: collectionMap.get(favorite.id) ?? [],
    })),
    isFavoritesTableMissing: false,
  }
}

export async function getFavoriteCollections() {
  const user = await getCurrentUser()
  if (!user) return [] as FavoriteCollection[]

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("favorite_collections")
    .select("*, favorite_collection_items(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) return [] as FavoriteCollection[]

  return (data ?? []).map((collection) => ({
    ...collection,
    items_count: collection.favorite_collection_items?.[0]?.count ?? 0,
  })) as FavoriteCollection[]
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
