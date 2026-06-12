import { reportServerError } from "@/lib/security/errors"
import { createAdminClient } from "@/lib/supabase/admin"

export const analyticsEventTypes = [
  "profile_view",
  "contractor_view",
  "expert_view",
  "material_view",
  "tender_view",
  "event_view",
  "favorite_added",
  "contact_click",
  "profile_website_click",
  "profile_telegram_click",
  "external_link_click",
  "material_author_click",
  "material_organization_click",
  "tender_response_created",
  "tender_response_status_changed",
  "tender_saved",
  "event_participation_going",
  "event_participation_interested",
  "event_participation_not_going",
  "event_registration_click",
  "qr_scan",
  "ics_download",
  "telegram_share",
  "search",
  "filter_used",
] as const

export type AnalyticsEventType = (typeof analyticsEventTypes)[number]

export type TrackAnalyticsEventInput = {
  eventType: AnalyticsEventType
  actorUserId?: string | null
  targetType?: string | null
  targetId?: string | null
  ownerType?: "expert" | "organization" | null
  ownerId?: string | null
  source?: string | null
  metadata?: Record<string, unknown>
  visitorKey?: string | null
}

type AnalyticsOwnerType = "expert" | "organization"

function textValue(
  row: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }

  return null
}

function numberValue(
  row: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = Number(row[key])
    if (Number.isFinite(value) && value > 0) return value
  }

  return null
}

function listValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return typeof value === "string"
    ? value
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

async function upsertAnalyticsDimensions(input: {
  targetType: string
  targetId: string
  ownerType: AnalyticsOwnerType
  ownerId: string
  category?: string | null
  region?: string | null
  sizeBucket?: string | null
  specializations?: string[]
  services?: string[]
  materialType?: string | null
  dimensions?: Record<string, unknown>
}) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("analytics_object_dimensions").upsert(
      {
        target_type: input.targetType,
        target_id: input.targetId,
        owner_type: input.ownerType,
        owner_id: input.ownerId,
        category: input.category ?? null,
        region: input.region ?? null,
        size_bucket: input.sizeBucket ?? null,
        specializations: input.specializations ?? [],
        services: input.services ?? [],
        material_type: input.materialType ?? null,
        dimensions: input.dimensions ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "target_type,target_id" },
    )

    if (error) reportServerError("analytics.syncDimensions", error)
  } catch (error) {
    reportServerError("analytics.syncDimensions", error)
  }
}

function contractorSizeBucket(teamSize: number | null) {
  if (!teamSize) return null
  if (teamSize < 10) return "under_10"
  if (teamSize <= 50) return "10_50"
  return "over_50"
}

export function isAnalyticsEventType(
  value: unknown,
): value is AnalyticsEventType {
  return (
    typeof value === "string" &&
    analyticsEventTypes.includes(value as AnalyticsEventType)
  )
}

export async function trackAnalyticsEvent(
  input: TrackAnalyticsEventInput,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const metadata = input.metadata ?? {}
    const { error } = await supabase.from("analytics_events").insert({
      event_name: input.eventType,
      event_data: metadata,
      user_id: input.actorUserId ?? null,
      organization_id:
        input.ownerType === "organization" ? (input.ownerId ?? null) : null,
      event_type: input.eventType,
      actor_user_id: input.actorUserId ?? null,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      owner_type: input.ownerType ?? null,
      owner_id: input.ownerId ?? null,
      source: input.source ?? null,
      metadata,
      visitor_key: input.visitorKey?.slice(0, 120) ?? null,
    })

    if (error) {
      reportServerError("analytics.track", error)
    }
  } catch (error) {
    reportServerError("analytics.track", error)
  }
}

export async function resolveAnalyticsTarget(
  targetType: string,
  targetId: string,
): Promise<{
  targetType: string
  targetId: string
  ownerType: "expert" | "organization"
  ownerId: string
} | null> {
  const supabase = createAdminClient()

  if (targetType === "expert") {
    const { data } = await supabase
      .from("expert_profiles")
      .select("*")
      .eq("id", targetId)
      .maybeSingle()

    if (!data) return null

    const row = data as Record<string, unknown>
    await upsertAnalyticsDimensions({
      targetType,
      targetId,
      ownerType: "expert",
      ownerId: targetId,
      category: textValue(row, "position"),
      region: textValue(row, "city"),
      specializations: listValue(row.specializations),
      dimensions: {
        skills: listValue(row.skills),
        activity_areas: listValue(row.activity_areas),
        experience_years: numberValue(row, "experience_years"),
      },
    })

    return { targetType, targetId, ownerType: "expert", ownerId: targetId }
  }

  if (targetType === "contractor" || targetType === "organization") {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", targetId)
      .maybeSingle()

    if (!data) return null

    const [{ data: profile }, { data: serviceRows }] = await Promise.all([
      supabase
        .from("contractor_profiles")
        .select("*")
        .eq("organization_id", targetId)
        .maybeSingle(),
      supabase
        .from("organization_services")
        .select("services(name)")
        .eq("organization_id", targetId),
    ])
    const row = data as Record<string, unknown>
    const profileRow = (profile ?? {}) as Record<string, unknown>
    const services = (serviceRows ?? [])
      .map((item) => {
        const service = item.services as { name?: unknown } | null
        return typeof service?.name === "string" ? service.name : null
      })
      .filter((item): item is string => Boolean(item))
    const teamSize = numberValue(profileRow, "team_size")

    await upsertAnalyticsDimensions({
      targetType,
      targetId,
      ownerType: "organization",
      ownerId: targetId,
      category: services[0] ?? null,
      region: textValue(row, "city"),
      sizeBucket: contractorSizeBucket(teamSize),
      services,
      dimensions: {
        team_size: teamSize,
        min_budget:
          numberValue(profileRow, "min_budget") ??
          numberValue(row, "min_budget"),
      },
    })

    return {
      targetType,
      targetId,
      ownerType: "organization",
      ownerId: targetId,
    }
  }

  if (targetType === "material") {
    const { data } = await supabase
      .from("materials")
      .select("*")
      .eq("id", targetId)
      .maybeSingle()

    if (!data) return null
    const expertId = data.expert_id as string | null
    const organizationId = (data.organization_id ?? data.company_id) as
      | string
      | null
    const isExpert = data.owner_type === "expert" && expertId
    const ownerId = isExpert ? expertId : organizationId

    if (!ownerId) return null

    const row = data as Record<string, unknown>
    const ownerType = isExpert ? "expert" : "organization"
    await upsertAnalyticsDimensions({
      targetType,
      targetId,
      ownerType,
      ownerId,
      category: textValue(row, "category"),
      materialType: textValue(row, "type"),
      dimensions: {
        tags: listValue(row.tags),
      },
    })

    return { targetType, targetId, ownerType, ownerId }
  }

  if (targetType === "tender") {
    const { data } = await supabase
      .from("tenders")
      .select("*")
      .eq("id", targetId)
      .maybeSingle()

    if (!data?.organization_id) return null

    await syncTenderAnalyticsFacts(targetId, data as Record<string, unknown>)
    return {
      targetType,
      targetId,
      ownerType: "organization",
      ownerId: data.organization_id as string,
    }
  }

  if (targetType === "event") {
    const { data } = await supabase
      .from("events")
      .select("id, owner_type, owner_id")
      .eq("id", targetId)
      .maybeSingle()

    return data?.owner_id
      ? {
          targetType,
          targetId,
          ownerType: data.owner_type as "expert" | "organization",
          ownerId: data.owner_id as string,
        }
      : null
  }

  return null
}

export async function syncTenderAnalyticsFacts(
  tenderId: string,
  tenderData?: Record<string, unknown>,
) {
  try {
    const supabase = createAdminClient()
    let row = tenderData

    if (!row) {
      const { data, error } = await supabase
        .from("tenders")
        .select("*")
        .eq("id", tenderId)
        .maybeSingle()

      if (error || !data) {
        if (error) reportServerError("analytics.syncTenderFacts", error)
        return
      }
      row = data as Record<string, unknown>
    }

    const createdAt = textValue(row, "created_at", "published_at")
    const deadline = textValue(row, "deadline")
    const durationDays =
      createdAt && deadline
        ? Math.max(
            0,
            Math.ceil(
              (new Date(deadline).getTime() - new Date(createdAt).getTime()) /
                86_400_000,
            ),
          )
        : null
    const organizationId = textValue(row, "organization_id")

    const { error } = await supabase.from("analytics_tender_facts").upsert({
      tender_id: tenderId,
      organization_id: organizationId,
      budget_value: numberValue(row, "budget"),
      budget_from: numberValue(row, "budget_from"),
      budget_to: numberValue(row, "budget_to"),
      duration_days: durationDays,
      service_category: textValue(row, "service_category", "category"),
      industry: textValue(row, "industry"),
      status: textValue(row, "status"),
      published_at: textValue(row, "published_at"),
      updated_at: new Date().toISOString(),
    })

    if (error) reportServerError("analytics.syncTenderFacts", error)

    if (organizationId) {
      await upsertAnalyticsDimensions({
        targetType: "tender",
        targetId: tenderId,
        ownerType: "organization",
        ownerId: organizationId,
        category: textValue(row, "service_category", "category"),
        dimensions: {
          industry: textValue(row, "industry"),
          duration_days: durationDays,
          budget_from: numberValue(row, "budget_from"),
          budget_to: numberValue(row, "budget_to"),
        },
      })
    }
  } catch (error) {
    reportServerError("analytics.syncTenderFacts", error)
  }
}

export async function trackFavoriteAdded({
  targetType,
  targetId,
  actorUserId,
}: {
  targetType: "company" | "expert" | "case" | "article" | "event"
  targetId: string
  actorUserId: string
}) {
  const analyticsTargetType =
    targetType === "company"
      ? "contractor"
      : targetType === "case" || targetType === "article"
        ? "material"
        : targetType === "event"
          ? "event"
          : "expert"
  const target = await resolveAnalyticsTarget(analyticsTargetType, targetId)
  if (!target) return

  await trackAnalyticsEvent({
    eventType: "favorite_added",
    actorUserId,
    ...target,
    source: "favorites",
    metadata: { favorite_type: targetType },
  })
}
