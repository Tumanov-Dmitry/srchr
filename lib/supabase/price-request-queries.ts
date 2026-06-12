import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentExpertProfile,
  getCurrentUser,
  getUserOrganizationMemberships,
} from "@/lib/supabase/queries"
import type {
  Organization,
  PriceRequest,
  PriceRequestInsights,
  PriceRequestResponse,
} from "@/types"

function isMissingTable(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? ""
  return (
    error?.code === "42P01" ||
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  )
}

function median(values: number[]) {
  if (values.length === 0) return null
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

function buildInsights(
  responses: Array<{
    min_cost: number
    max_cost: number
    min_duration_days: number
    max_duration_days: number
  }>,
): PriceRequestInsights {
  const costs = responses.map(
    (response) => (Number(response.min_cost) + Number(response.max_cost)) / 2,
  )
  const durations = responses.map(
    (response) =>
      (Number(response.min_duration_days) +
        Number(response.max_duration_days)) /
      2,
  )
  const samples = responses.length

  return {
    samples,
    minCost:
      samples > 0
        ? Math.min(...responses.map((response) => Number(response.min_cost)))
        : null,
    maxCost:
      samples > 0
        ? Math.max(...responses.map((response) => Number(response.max_cost)))
        : null,
    averageCost:
      samples > 0
        ? Math.round(costs.reduce((sum, value) => sum + value, 0) / samples)
        : null,
    medianCost: median(costs),
    averageDurationDays:
      samples > 0
        ? Math.round(durations.reduce((sum, value) => sum + value, 0) / samples)
        : null,
    confidence: samples >= 10 ? "high" : samples >= 4 ? "medium" : "low",
  }
}

export async function getActivePriceRequests() {
  const user = await getCurrentUser()
  if (!user) {
    return {
      user: null,
      requests: [] as PriceRequest[],
      isMissing: false,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("price_requests")
    .select("*, organizations(id, name, slug, logo_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
  const requests = error ? [] : ((data ?? []) as PriceRequest[])

  if (requests.length > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient()
    const { data: counts } = await admin
      .from("price_request_responses")
      .select("price_request_id")
      .in(
        "price_request_id",
        requests.map((request) => request.id),
      )
    const countMap = new Map<string, number>()
    for (const row of counts ?? []) {
      const id = row.price_request_id as string
      countMap.set(id, (countMap.get(id) ?? 0) + 1)
    }
    requests.forEach((request) => {
      request.responses_count = countMap.get(request.id) ?? 0
    })
  }

  return {
    user,
    requests,
    isMissing: isMissingTable(error),
  }
}

export async function getDashboardPriceRequests() {
  const user = await getCurrentUser()
  if (!user) {
    return {
      user: null,
      requests: [] as PriceRequest[],
      isMissing: false,
    }
  }

  const memberships = await getUserOrganizationMemberships(user.id)
  const organizationIds = memberships
    .filter((membership) =>
      ["owner", "admin", "editor"].includes(membership.role ?? "member"),
    )
    .map(
      (membership) =>
        membership.organization_id ??
        membership.org_id ??
        membership.organizations?.id,
    )
    .filter((id): id is string => Boolean(id))
  const filters = [`created_by.eq.${user.id}`]
  organizationIds.forEach((id) => filters.push(`organization_id.eq.${id}`))

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("price_requests")
    .select("*, organizations(id, name, slug, logo_url)")
    .or(filters.join(","))
    .order("created_at", { ascending: false })

  return {
    user,
    requests: error ? [] : ((data ?? []) as PriceRequest[]),
    isMissing: isMissingTable(error),
  }
}

export async function getPriceRequestById(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    return {
      user: null,
      request: null,
      responses: [] as PriceRequestResponse[],
      insights: buildInsights([]),
      responderOptions: [],
      isOwner: false,
      isMissing: false,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("price_requests")
    .select("*, organizations(id, name, slug, logo_url)")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) {
    return {
      user,
      request: null,
      responses: [] as PriceRequestResponse[],
      insights: buildInsights([]),
      responderOptions: [],
      isOwner: false,
      isMissing: isMissingTable(error),
    }
  }

  const request = data as PriceRequest
  const memberships = await getUserOrganizationMemberships(user.id)
  const organizationIds = memberships
    .filter((membership) =>
      ["owner", "admin", "editor"].includes(membership.role ?? "member"),
    )
    .map(
      (membership) =>
        membership.organization_id ??
        membership.org_id ??
        membership.organizations?.id,
    )
    .filter((organizationId): organizationId is string =>
      Boolean(organizationId),
    )
  const isOwner =
    request.created_by === user.id ||
    Boolean(
      request.organization_id &&
      organizationIds.includes(request.organization_id),
    )
  const { profile: expert } = await getCurrentExpertProfile()
  const contractorOrganizations = memberships
    .map((membership) => membership.organizations)
    .filter((organization): organization is Organization =>
      Boolean(organization?.id && organization.is_contractor),
    )
  const responderOptions = [
    ...(expert
      ? [
          {
            value: `expert:${expert.id}`,
            label:
              [expert.first_name, expert.last_name].filter(Boolean).join(" ") ||
              "Эксперт",
          },
        ]
      : []),
    ...contractorOrganizations.map((organization) => ({
      value: `organization:${organization.id}`,
      label: organization.name,
    })),
  ]

  const { data: visibleResponses } = await supabase
    .from("price_request_responses")
    .select(
      "*, expert_profiles(id, first_name, last_name, slug, avatar_url), organizations(id, name, slug, logo_url)",
    )
    .eq("price_request_id", id)
    .order("created_at", { ascending: false })

  let marketResponses: Array<{
    min_cost: number
    max_cost: number
    min_duration_days: number
    max_duration_days: number
  }> = []

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient()
    const { data: similarRequests } = await admin
      .from("price_requests")
      .select("id")
      .ilike("service_category", request.service_category)
      .in("status", ["active", "completed", "converted_to_tender"])
      .limit(100)
    const requestIds = (similarRequests ?? []).map((item) => item.id as string)

    if (requestIds.length > 0) {
      const { data: aggregateRows } = await admin
        .from("price_request_responses")
        .select("min_cost, max_cost, min_duration_days, max_duration_days")
        .in("price_request_id", requestIds)
        .limit(500)
      marketResponses = aggregateRows ?? []
    }
  }

  return {
    user,
    request,
    responses: (visibleResponses ?? []) as PriceRequestResponse[],
    insights: buildInsights(marketResponses),
    responderOptions,
    isOwner,
    isMissing: false,
  }
}

export async function getPriceRequestEditor(id: string) {
  const result = await getPriceRequestById(id)
  return {
    ...result,
    request: result.isOwner ? result.request : null,
  }
}
