import { NextResponse } from "next/server"
import { resolveAnalyticsTarget, trackAnalyticsEvent } from "@/lib/analytics"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ targetType: string; targetId: string }> },
) {
  const { targetType, targetId } = await params
  const url = new URL(request.url)
  const destination = url.searchParams.get("to")

  if (!destination?.startsWith("/") || destination.startsWith("//")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const resolved = await resolveAnalyticsTarget(targetType, targetId)
  if (resolved) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await trackAnalyticsEvent({
      eventType: "qr_scan",
      actorUserId: user?.id ?? null,
      ...resolved,
      source: "qr",
    })
  }

  return NextResponse.redirect(new URL(destination, request.url))
}
