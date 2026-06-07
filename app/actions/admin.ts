"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { encodeMessage } from "@/lib/messages"
import { reportServerError } from "@/lib/security/errors"
import {
  createNotification,
  createNotificationEvent,
} from "@/lib/notifications"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAdminAccess } from "@/lib/supabase/admin-queries"

type TableName =
  | "profiles"
  | "organizations"
  | "materials"
  | "tenders"
  | "expert_profiles"
  | "events"

function value(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim()
  return raw.length > 0 ? raw : null
}

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeMessage(message)}`)
}

async function requireAdmin() {
  const access = await getAdminAccess()

  if (!access.user) redirect("/login")
  if (!access.isAdmin) redirect("/")

  return access
}

function safeStatus(status: string | null, allowed: string[], fallback: string) {
  return status && allowed.includes(status) ? status : fallback
}

async function updateStatus(
  table: TableName,
  id: string | null,
  status: string,
  path: string,
) {
  await requireAdmin()

  if (!id) redirectWithMessage(path, "Объект не найден")

  const supabase = createAdminClient()
  const payload: Record<string, string | null> = { status }

  if (table === "materials" && status === "published") {
    payload.published_at = new Date().toISOString()
  }

  if (table === "tenders" && status === "published") {
    payload.published_at = new Date().toISOString()
  }

  if (table === "events" && status === "published") {
    payload.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from(table).update(payload).eq("id", id)

  if (error) {
    reportServerError(`admin.updateStatus.${table}`, error)
    redirectWithMessage(path, "Не удалось изменить статус")
  }

  if (["materials", "tenders", "events"].includes(table)) {
    const { data: row } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle()
    const title = String(row?.title ?? "Объект обновлен")
    const createdBy = typeof row?.created_by === "string" ? row.created_by : null
    const targetType =
      table === "materials"
        ? String(row?.type ?? "material")
        : table === "tenders"
          ? "tender"
          : "event"
    const targetUrl =
      table === "events"
        ? `/events/${row?.slug ?? ""}`
        : table === "tenders"
          ? `/tenders/${row?.slug ?? ""}`
          : `/media/${row?.slug ?? ""}`

    await createNotificationEvent({
      event_key: `${targetType}_${status}`,
      event_type: "admin_status_changed",
      source: "admin",
      target_type: targetType,
      target_id: id,
      title: `Статус обновлен: ${status}`,
      text: title,
    })

    if (createdBy) {
      await createNotification({
        recipient_id: createdBy,
        title: `Статус обновлен: ${title}`,
        text: `Новый статус: ${status}`,
        type: targetType,
        target_type: targetType,
        target_id: id,
        target_url: targetUrl,
      })
    }
  }

  revalidatePath("/admin")
  revalidatePath(path)
  redirectWithMessage(path, "Статус обновлен")
}

export async function updateAdminProfile(formData: FormData) {
  await requireAdmin()

  const id = value(formData, "id")
  const accountType = safeStatus(value(formData, "account_type"), [
    "guest",
    "contractor",
    "client",
    "admin",
  ], "guest")
  const path = "/admin/users"

  if (!id) redirectWithMessage(path, "Пользователь не найден")

  const supabase = createAdminClient()
  const { error: combinedError } = await supabase
    .from("profiles")
    .upsert(
      { id, role: accountType, account_type: accountType },
      { onConflict: "id" },
    )

  if (combinedError) {
    const { error: accountTypeError } = await supabase
      .from("profiles")
      .upsert({ id, account_type: accountType }, { onConflict: "id" })

    if (accountTypeError) {
      const { error: roleError } = await supabase
        .from("profiles")
        .upsert({ id, role: accountType }, { onConflict: "id" })

      if (roleError) {
        reportServerError("admin.updateProfile", {
          combinedError,
          accountTypeError,
          roleError,
        })
        redirectWithMessage(path, "Не удалось обновить пользователя")
      }
    }
  }

  revalidatePath(path)
  redirectWithMessage(path, "Пользователь обновлен")
}

export async function updateAdminOrganizationStatus(formData: FormData) {
  const status = safeStatus(value(formData, "status"), [
    "draft",
    "moderation",
    "published",
    "rejected",
    "archived",
    "blocked",
  ], "draft")

  await updateStatus("organizations", value(formData, "id"), status, "/admin/organizations")
}

export async function updateAdminMaterialStatus(formData: FormData) {
  const status = safeStatus(value(formData, "status"), [
    "draft",
    "moderation",
    "published",
    "rejected",
    "archived",
  ], "draft")
  const type = value(formData, "type")
  const path = type === "case" ? "/admin/cases" : type === "article" ? "/admin/articles" : "/admin/materials"

  await updateStatus("materials", value(formData, "id"), status, path)
}

export async function updateAdminTenderStatus(formData: FormData) {
  const status = safeStatus(value(formData, "status"), [
    "draft",
    "moderation",
    "published",
    "closed",
    "rejected",
    "archived",
  ], "draft")

  await updateStatus("tenders", value(formData, "id"), status, "/admin/tenders")
}

export async function updateAdminExpertStatus(formData: FormData) {
  const status = safeStatus(value(formData, "status"), [
    "draft",
    "published",
    "hidden",
    "blocked",
    "archived",
  ], "draft")

  await updateStatus("expert_profiles", value(formData, "id"), status, "/admin/experts")
}

export async function updateAdminEventStatus(formData: FormData) {
  const status = safeStatus(value(formData, "status"), [
    "draft",
    "moderation",
    "published",
    "rejected",
    "archived",
    "cancelled",
    "completed",
  ], "draft")

  await updateStatus("events", value(formData, "id"), status, "/admin/events")
}

export async function updateAdminEventPromotion(formData: FormData) {
  await requireAdmin()

  const id = value(formData, "id")
  const isPromoted = value(formData, "is_promoted") === "on"
  const promotedUntil = value(formData, "promoted_until")
  const promotionUrl = value(formData, "promotion_url")
  const path = "/admin/events"

  if (!id) redirectWithMessage(path, "Событие не найдено")

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("events")
    .update({
      is_promoted: isPromoted,
      promoted_until: isPromoted ? promotedUntil : null,
      promotion_url: promotionUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    reportServerError("admin.updateEventPromotion", error)
    redirectWithMessage(path, "Не удалось обновить продвижение")
  }

  revalidatePath("/events")
  revalidatePath(path)
  redirectWithMessage(path, "Продвижение обновлено")
}
