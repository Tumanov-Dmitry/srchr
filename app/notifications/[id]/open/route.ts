import { NextResponse } from "next/server"
import { hydrateNotificationTargetUrls } from "@/lib/notification-targets"
import { createClient } from "@/lib/supabase/server"
import type { Notification } from "@/types"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("id", id)
    .eq("recipient_id", user.id)
    .maybeSingle()

  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", user.id)

  const [notification] = await hydrateNotificationTargetUrls(
    supabase,
    data ? ([data] as Notification[]) : [],
  )
  const targetPath = notification?.target_url ?? "/dashboard/notifications"

  return NextResponse.redirect(new URL(targetPath, request.url))
}
