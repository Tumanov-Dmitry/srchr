import { createAdminClient } from "@/lib/supabase/admin"
import type { NotificationSeverity } from "@/types"

type NotificationEventInput = {
  event_key: string
  event_type?: string | null
  source?: string | null
  actor_id?: string | null
  target_type?: string | null
  target_id?: string | null
  title?: string | null
  text?: string | null
  severity?: NotificationSeverity
  payload?: Record<string, unknown>
}

type NotificationInput = {
  recipient_id: string
  title: string
  text?: string | null
  type?: string
  target_type?: string | null
  target_id?: string | null
  target_url?: string | null
  channels?: string[]
}

function isMissingNotificationsTable(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? ""
  return (
    error?.code === "42P01" ||
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  )
}

export async function createNotificationEvent(input: NotificationEventInput) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("notification_events")
    .insert({
      event_key: input.event_key,
      event_type: input.event_type ?? input.event_key,
      source: input.source ?? "srchr",
      actor_id: input.actor_id ?? null,
      target_type: input.target_type ?? null,
      target_id: input.target_id ?? null,
      title: input.title ?? null,
      text: input.text ?? null,
      severity: input.severity ?? "info",
      payload: input.payload ?? {},
    })
    .select("id")
    .maybeSingle()

  if (isMissingNotificationsTable(error)) return null
  if (error) throw new Error(error.message)

  return data
}

export async function createNotification(input: NotificationInput) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      recipient_id: input.recipient_id,
      title: input.title,
      text: input.text ?? null,
      type: input.type ?? "system",
      target_type: input.target_type ?? null,
      target_id: input.target_id ?? null,
      target_url: input.target_url ?? null,
      channels: input.channels ?? ["in_app"],
    })
    .select("id")
    .maybeSingle()

  if (isMissingNotificationsTable(error)) return null
  if (error) throw new Error(error.message)

  return data
}

export async function notifyAdmins(input: Omit<NotificationInput, "recipient_id">) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .or("role.in.(admin,super_admin,moderator),account_type.in.(admin,super_admin,moderator)")

  if (error) return

  await Promise.all(
    (data ?? []).map((profile) =>
      createNotification({
        ...input,
        recipient_id: profile.id as string,
        type: input.type ?? "admin",
      }),
    ),
  )
}
