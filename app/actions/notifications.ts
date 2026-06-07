"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { encodeMessage } from "@/lib/messages"
import { reportServerError } from "@/lib/security/errors"
import { createClient } from "@/lib/supabase/server"
import { notificationPreferenceGroups } from "@/lib/supabase/notification-queries"

function value(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim()
  return raw.length > 0 ? raw : null
}

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeMessage(message)}`)
}

function revalidateNotificationSurfaces() {
  revalidatePath("/dashboard/notifications")
  revalidatePath("/notifications")
  revalidatePath("/dashboard")
  revalidatePath("/")
}

export async function markNotificationRead(formData: FormData) {
  const id = value(formData, "id")
  const path = value(formData, "path") ?? "/dashboard/notifications"

  if (!id) redirectWithMessage(path, "Уведомление не найдено")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", user.id)

  if (error) {
    reportServerError("notifications.markRead", error)
    redirectWithMessage(path, "Не удалось отметить уведомление")
  }

  revalidateNotificationSurfaces()
  redirect(path)
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .eq("is_read", false)

  if (error) {
    reportServerError("notifications.markAllRead", error)
    redirectWithMessage(
      "/dashboard/notifications",
      "Не удалось отметить уведомления",
    )
  }

  revalidateNotificationSurfaces()
  redirectWithMessage(
    "/dashboard/notifications",
    "Все уведомления отмечены прочитанными",
  )
}

export async function saveNotificationPreferences(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const rows = notificationPreferenceGroups.flatMap((group) =>
    group.items.map(([eventKey]) => ({
      user_id: user.id,
      category: group.category,
      event_key: eventKey,
      in_app: formData.get(`${eventKey}:in_app`) === "on",
      email: formData.get(`${eventKey}:email`) === "on",
      telegram: formData.get(`${eventKey}:telegram`) === "on",
      updated_at: new Date().toISOString(),
    })),
  )

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(rows, { onConflict: "user_id,event_key" })

  if (error) {
    reportServerError("notifications.preferences", error)
    redirectWithMessage(
      "/dashboard/settings",
      "Не удалось сохранить настройки уведомлений",
    )
  }

  revalidatePath("/dashboard/settings")
  redirectWithMessage("/dashboard/settings", "Настройки уведомлений сохранены")
}
