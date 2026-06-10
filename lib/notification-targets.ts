import type { SupabaseClient } from "@supabase/supabase-js"
import type { Notification } from "@/types"

type SlugRow = {
  id: string
  slug?: string | null
  status?: string | null
}

export function normalizeNotificationTargetUrl(targetUrl?: string | null) {
  if (!targetUrl) return null

  const trimmed = targetUrl.trim()
  if (!trimmed || /^\/notifications\/[^/]+\/open(?:$|[?#])/.test(trimmed)) {
    return null
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed

  try {
    const url = new URL(trimmed)
    const path = `${url.pathname}${url.search}${url.hash}`

    if (/^\/notifications\/[^/]+\/open(?:$|[?#])/.test(path)) return null

    return path || null
  } catch {
    return null
  }
}

function byId(rows: SlugRow[] | null) {
  return new Map((rows ?? []).map((row) => [row.id, row]))
}

function idsByType(notifications: Notification[], types: string[]) {
  return Array.from(
    new Set(
      notifications
        .filter((notification) =>
          types.includes(notificationTargetType(notification)),
        )
        .map(notificationTargetId)
        .filter((id): id is string => Boolean(id)),
    ),
  )
}

function notificationTargetType(notification: Notification) {
  return notification.target_type ?? notification.type ?? ""
}

function notificationTargetId(notification: Notification) {
  if (notification.target_id) return notification.target_id

  const targetUrl = normalizeNotificationTargetUrl(notification.target_url)
  if (!targetUrl) return null

  try {
    const url = new URL(targetUrl, "https://srchr.local")
    const queryTarget = url.searchParams.get("target")
    const pathUuid = url.pathname.match(
      /\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?:\/|$)/i,
    )?.[1]

    return queryTarget ?? pathUuid ?? null
  } catch {
    return null
  }
}

async function fetchTargets(
  supabase: SupabaseClient,
  table: string,
  ids: string[],
) {
  if (ids.length === 0) return new Map<string, SlugRow>()

  const { data } = await supabase
    .from(table)
    .select("id, slug, status")
    .in("id", ids)

  return byId((data ?? []) as SlugRow[])
}

export async function hydrateNotificationTargetUrls(
  supabase: SupabaseClient,
  notifications: Notification[],
) {
  if (notifications.length === 0) return notifications

  const materialIds = idsByType(notifications, ["case", "article", "material"])
  const eventIds = idsByType(notifications, ["event"])
  const tenderIds = idsByType(notifications, ["tender", "task"])

  const [materials, events, tenders] = await Promise.all([
    fetchTargets(supabase, "materials", materialIds),
    fetchTargets(supabase, "events", eventIds),
    fetchTargets(supabase, "tenders", tenderIds),
  ])

  return notifications.map((notification) => {
    const normalizedUrl = normalizeNotificationTargetUrl(
      notification.target_url,
    )
    const targetType = notificationTargetType(notification)
    const targetId = notificationTargetId(notification)
    const isAdminNotification = notification.type === "admin"

    if (targetId && targetType === "event") {
      const event = events.get(targetId)
      return {
        ...notification,
        target_url: isAdminNotification
          ? `/admin/events/${targetId}/edit`
          : event?.slug &&
              (event.status === "published" || event.status === "completed")
            ? `/events/${event.slug}`
            : event
              ? `/dashboard/events/${targetId}/edit`
              : "/dashboard/notifications",
      }
    }

    if (targetId && (targetType === "tender" || targetType === "task")) {
      const tender = tenders.get(targetId)
      return {
        ...notification,
        target_url:
          tender?.slug && tender.status === "published"
            ? `/tenders/${tender.slug}`
            : tender
              ? `/dashboard/client/tenders/${targetId}/edit`
              : "/dashboard/notifications",
      }
    }

    if (
      targetId &&
      (targetType === "case" ||
        targetType === "article" ||
        targetType === "material")
    ) {
      const material = materials.get(targetId)
      return {
        ...notification,
        target_url: isAdminNotification
          ? `/admin/materials?target=${targetId}`
          : material?.slug && material.status === "published"
            ? `/media/${material.slug}`
            : material
              ? `/dashboard/media/${targetId}/edit`
              : "/dashboard/notifications",
      }
    }

    return {
      ...notification,
      target_url: normalizedUrl ?? "/dashboard/notifications",
    }
  })
}
