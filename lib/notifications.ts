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

function isMissingRelation(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? ""
  return (
    error?.code === "42P01" ||
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  )
}

function isMissingColumn(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? ""
  return (
    error?.code === "42703" ||
    message.includes("column") && message.includes("does not exist")
  )
}

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))))
}

export function normalizeNotificationTargetUrl(targetUrl?: string | null) {
  if (!targetUrl) return null

  const trimmed = targetUrl.trim()
  if (!trimmed) return null

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed

  try {
    const url = new URL(trimmed)
    return `${url.pathname}${url.search}${url.hash}` || null
  } catch {
    return null
  }
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

  if (isMissingRelation(error)) return null
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
      target_url: normalizeNotificationTargetUrl(input.target_url),
      channels: input.channels ?? ["in_app"],
    })
    .select("id")
    .maybeSingle()

  if (isMissingRelation(error)) return null
  if (error) throw new Error(error.message)

  return data
}

export async function notifyAdmins(input: Omit<NotificationInput, "recipient_id">) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return

  const supabase = createAdminClient()
  const adminIds: string[] = []

  const { data: accountTypeAdmins, error: accountTypeError } = await supabase
    .from("profiles")
    .select("id")
    .in("account_type", ["admin", "super_admin", "moderator"])

  if (!accountTypeError) {
    adminIds.push(...(accountTypeAdmins ?? []).map((profile) => profile.id as string))
  } else if (!isMissingColumn(accountTypeError) && !isMissingRelation(accountTypeError)) {
    throw new Error(accountTypeError.message)
  }

  const { data: roleAdmins, error: roleError } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["admin", "super_admin", "moderator"])

  if (!roleError) {
    adminIds.push(...(roleAdmins ?? []).map((profile) => profile.id as string))
  } else if (!isMissingColumn(roleError) && !isMissingRelation(roleError)) {
    throw new Error(roleError.message)
  }

  const { data: usersData } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  adminIds.push(
    ...(usersData.users ?? [])
      .filter((user) =>
        ["admin", "super_admin", "moderator"].includes(
          String(user.app_metadata?.role ?? user.app_metadata?.account_type ?? ""),
        ),
      )
      .map((user) => user.id),
  )

  await Promise.all(
    uniqueIds(adminIds).map((recipientId) =>
      createNotification({
        ...input,
        recipient_id: recipientId,
        type: input.type ?? "admin",
      }),
    ),
  )
}
