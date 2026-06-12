import { createAdminClient } from "@/lib/supabase/admin"
import { getAdminAccess } from "@/lib/supabase/admin-queries"
import {
  getCurrentExpertProfile,
  getCurrentUser,
  getUserOrganizationMemberships,
} from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/server"
import type {
  AnalyticsDailyStat,
  AnalyticsMetricKey,
  AnalyticsPeriod,
  ExpertProfile,
  Organization,
} from "@/types"

export type AnalyticsSeriesPoint = {
  date: string
  value: number
}

export type AnalyticsReport = {
  totals: Partial<Record<AnalyticsMetricKey, number>>
  series: AnalyticsSeriesPoint[]
  rows: AnalyticsDailyStat[]
  isMissing: boolean
}

export type AnalyticsOwner = {
  ownerType: "expert" | "organization"
  ownerId: string
  name: string
  href: string
}

export function normalizeAnalyticsPeriod(
  value?: string | null,
): AnalyticsPeriod {
  return value === "7" || value === "30" || value === "90" || value === "all"
    ? value
    : "30"
}

function periodStart(period: AnalyticsPeriod) {
  if (period === "all") return null

  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - Number(period) + 1)
  return start.toISOString().slice(0, 10)
}

function isMissingTable(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? ""
  return (
    error?.code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("Could not find the table")
  )
}

function buildReport(
  rows: AnalyticsDailyStat[],
  isMissing = false,
): AnalyticsReport {
  const totals: AnalyticsReport["totals"] = {}
  const viewsByDate = new Map<string, number>()

  for (const row of rows) {
    totals[row.metric_key] =
      (totals[row.metric_key] ?? 0) + Number(row.metric_value)

    if (row.metric_key === "views") {
      viewsByDate.set(
        row.date,
        (viewsByDate.get(row.date) ?? 0) + Number(row.metric_value),
      )
    }
  }

  return {
    totals,
    series: [...viewsByDate.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, value]) => ({ date, value })),
    rows,
    isMissing,
  }
}

async function queryStats({
  period,
  ownerType,
  ownerId,
  targetType,
  targetId,
  admin = false,
}: {
  period: AnalyticsPeriod
  ownerType?: "expert" | "organization"
  ownerId?: string
  targetType?: string
  targetId?: string
  admin?: boolean
}) {
  const supabase = admin ? createAdminClient() : await createClient()
  let query = supabase
    .from("analytics_daily_stats")
    .select("*")
    .order("date", { ascending: true })

  if (ownerType) query = query.eq("owner_type", ownerType)
  if (ownerId) query = query.eq("owner_id", ownerId)
  if (targetType) query = query.eq("target_type", targetType)
  if (targetId) query = query.eq("target_id", targetId)

  const start = periodStart(period)
  if (start) query = query.gte("date", start)

  const { data, error } = await query
  if (isMissingTable(error)) return buildReport([], true)
  if (error) return buildReport([])

  return buildReport((data ?? []) as AnalyticsDailyStat[])
}

export async function getExpertAnalytics(period: AnalyticsPeriod) {
  const { user, profile } = await getCurrentExpertProfile()

  return {
    user,
    profile,
    report: profile
      ? await queryStats({
          period,
          ownerType: "expert",
          ownerId: profile.id,
        })
      : buildReport([]),
  }
}

export async function getOrganizationAnalytics(period: AnalyticsPeriod) {
  const user = await getCurrentUser()
  if (!user) return { user: null, owners: [], reports: [] }

  const memberships = await getUserOrganizationMemberships(user.id)
  const owners = memberships
    .filter((membership) =>
      ["owner", "admin", "editor"].includes(membership.role ?? "member"),
    )
    .map((membership) => membership.organizations)
    .filter((organization): organization is Organization =>
      Boolean(organization?.id),
    )
    .filter(
      (organization, index, organizations) =>
        organizations.findIndex((item) => item.id === organization.id) ===
        index,
    )

  const reports = await Promise.all(
    owners.map(async (organization) => ({
      owner: organization,
      report: await queryStats({
        period,
        ownerType: "organization",
        ownerId: organization.id,
      }),
    })),
  )

  return { user, owners, reports }
}

export async function getDashboardAnalyticsOwners(): Promise<{
  user: Awaited<ReturnType<typeof getCurrentUser>>
  owners: AnalyticsOwner[]
}> {
  const user = await getCurrentUser()
  if (!user) return { user: null, owners: [] }

  const [{ profile }, memberships] = await Promise.all([
    getCurrentExpertProfile(),
    getUserOrganizationMemberships(user.id),
  ])
  const owners: AnalyticsOwner[] = []

  if (profile) {
    owners.push({
      ownerType: "expert",
      ownerId: profile.id,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
      href: "/dashboard/expert/analytics",
    })
  }

  memberships
    .filter((membership) =>
      ["owner", "admin", "editor"].includes(membership.role ?? "member"),
    )
    .forEach((membership) => {
      const organization = membership.organizations
      if (
        organization &&
        !owners.some(
          (owner) =>
            owner.ownerType === "organization" &&
            owner.ownerId === organization.id,
        )
      ) {
        owners.push({
          ownerType: "organization",
          ownerId: organization.id,
          name: organization.name,
          href: "/dashboard/organization/analytics",
        })
      }
    })

  return { user, owners }
}

export async function getTargetAnalytics(
  targetType: string,
  targetId: string,
  period: AnalyticsPeriod,
) {
  return queryStats({ period, targetType, targetId })
}

export async function getManagedTargetAnalytics(
  targetType: "tender" | "material" | "event",
  targetId: string,
  period: AnalyticsPeriod,
) {
  const user = await getCurrentUser()
  if (!user) return { user: null, target: null, report: buildReport([]) }

  const supabase = await createClient()
  const table =
    targetType === "tender"
      ? "tenders"
      : targetType === "material"
        ? "materials"
        : "events"
  const { data } = await supabase
    .from(table)
    .select("id, title")
    .eq("id", targetId)
    .maybeSingle()

  return {
    user,
    target: data as { id: string; title: string } | null,
    report: data
      ? await queryStats({ period, targetType, targetId })
      : buildReport([]),
  }
}

export async function getAdminAnalytics(period: AnalyticsPeriod) {
  const access = await getAdminAccess()
  if (!access.isAdmin) {
    return { access, report: buildReport([]), topTargets: [] }
  }

  const report = await queryStats({ period, admin: true })
  const grouped = new Map<
    string,
    {
      targetType: string
      targetId: string
      views: number
      favorites: number
      responses: number
    }
  >()

  for (const row of report.rows) {
    const key = `${row.target_type}:${row.target_id}`
    const current = grouped.get(key) ?? {
      targetType: row.target_type,
      targetId: row.target_id,
      views: 0,
      favorites: 0,
      responses: 0,
    }

    if (row.metric_key === "views") current.views += Number(row.metric_value)
    if (row.metric_key === "favorites")
      current.favorites += Number(row.metric_value)
    if (row.metric_key === "responses")
      current.responses += Number(row.metric_value)
    grouped.set(key, current)
  }

  return {
    access,
    report,
    topTargets: [...grouped.values()]
      .sort((left, right) => right.views - left.views)
      .slice(0, 20),
  }
}

export function getExpertName(profile: ExpertProfile) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ")
}

export async function getPublicViewCounts(
  targetType: string,
  targetIds: string[],
) {
  const counts = new Map<string, number>()
  const ids = [...new Set(targetIds.filter(Boolean))]
  if (ids.length === 0) return counts

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("analytics_public_totals")
    .select("target_id, views")
    .eq("target_type", targetType)
    .in("target_id", ids)

  if (error) {
    if (!isMissingTable(error)) {
      console.error("[analytics.publicViews]", error.message)
    }
    return counts
  }

  for (const row of data ?? []) {
    counts.set(row.target_id as string, Number(row.views ?? 0))
  }

  return counts
}

export async function getPublicViewCount(targetType: string, targetId: string) {
  const counts = await getPublicViewCounts(targetType, [targetId])
  return counts.get(targetId) ?? 0
}
