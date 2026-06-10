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
  "external_link_click",
  "tender_response_created",
  "event_participation_going",
  "event_participation_interested",
  "event_participation_not_going",
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
      .select("id")
      .eq("id", targetId)
      .maybeSingle()

    return data
      ? { targetType, targetId, ownerType: "expert", ownerId: targetId }
      : null
  }

  if (targetType === "contractor" || targetType === "organization") {
    const { data } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", targetId)
      .maybeSingle()

    return data
      ? { targetType, targetId, ownerType: "organization", ownerId: targetId }
      : null
  }

  if (targetType === "material") {
    const { data } = await supabase
      .from("materials")
      .select("id, owner_type, expert_id, organization_id, company_id")
      .eq("id", targetId)
      .maybeSingle()

    if (!data) return null
    const expertId = data.expert_id as string | null
    const organizationId = (data.organization_id ?? data.company_id) as
      | string
      | null
    const isExpert = data.owner_type === "expert" && expertId
    const ownerId = isExpert ? expertId : organizationId

    return ownerId
      ? {
          targetType,
          targetId,
          ownerType: isExpert ? "expert" : "organization",
          ownerId,
        }
      : null
  }

  if (targetType === "tender") {
    const { data } = await supabase
      .from("tenders")
      .select("id, organization_id")
      .eq("id", targetId)
      .maybeSingle()

    return data?.organization_id
      ? {
          targetType,
          targetId,
          ownerType: "organization",
          ownerId: data.organization_id as string,
        }
      : null
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

export async function trackFavoriteAdded({
  targetType,
  targetId,
  actorUserId,
}: {
  targetType: "company" | "expert" | "case" | "article"
  targetId: string
  actorUserId: string
}) {
  const analyticsTargetType =
    targetType === "company"
      ? "contractor"
      : targetType === "case" || targetType === "article"
        ? "material"
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
