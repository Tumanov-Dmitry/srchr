import { NextResponse } from "next/server"
import {
  isAnalyticsEventType,
  resolveAnalyticsTarget,
  trackAnalyticsEvent,
} from "@/lib/analytics"
import { checkRateLimit, getRequestIdentifier } from "@/lib/security/rate-limit"
import { createClient } from "@/lib/supabase/server"

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(
        ([, item]) =>
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean" ||
          item === null,
      )
      .slice(0, 12),
  )
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const eventType = body?.event_type
  const targetType = body?.target_type
  const targetId = body?.target_id

  if (
    !isAnalyticsEventType(eventType) ||
    typeof targetType !== "string" ||
    !isUuid(targetId)
  ) {
    return NextResponse.json(
      { error: "Invalid analytics event" },
      { status: 400 },
    )
  }

  const visitorKey =
    typeof body?.visitor_key === "string"
      ? body.visitor_key.slice(0, 120)
      : null
  const rateKey = getRequestIdentifier(request.headers)
  const rateLimit = checkRateLimit(`analytics:${rateKey}`, 120, 60_000)

  if (!rateLimit.allowed) {
    return new NextResponse(null, { status: 204 })
  }

  const isCatalogEvent =
    targetType === "catalog" &&
    targetId === "00000000-0000-4000-8000-000000000000" &&
    (eventType === "search" || eventType === "filter_used")
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isCatalogEvent) {
    await trackAnalyticsEvent({
      eventType,
      actorUserId: user?.id ?? null,
      targetType,
      targetId,
      source:
        typeof body?.source === "string" ? body.source.slice(0, 120) : null,
      metadata: safeMetadata(body?.metadata),
      visitorKey,
    })

    return new NextResponse(null, { status: 204 })
  }

  const resolved = await resolveAnalyticsTarget(targetType, targetId)
  if (!resolved?.ownerId) {
    return NextResponse.json(
      { error: "Analytics target not found" },
      { status: 404 },
    )
  }

  await trackAnalyticsEvent({
    eventType,
    actorUserId: user?.id ?? null,
    ...resolved,
    source: typeof body?.source === "string" ? body.source.slice(0, 120) : null,
    metadata: safeMetadata(body?.metadata),
    visitorKey,
  })

  return new NextResponse(null, { status: 204 })
}
