import { NextResponse } from "next/server"
import { normalizeNotificationTargetUrl } from "@/lib/notifications"
import { createClient } from "@/lib/supabase/server"

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
    .select("target_url")
    .eq("id", id)
    .eq("recipient_id", user.id)
    .maybeSingle()

  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", user.id)

  const targetPath =
    normalizeNotificationTargetUrl(data?.target_url) ?? "/dashboard/notifications"

  return NextResponse.redirect(new URL(targetPath, request.url))
}
