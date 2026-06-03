import type { SupabaseClient } from "@supabase/supabase-js"
import type { Notification } from "@/types"

type SlugRow = {
  id: string
  slug?: string | null
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
  return new Map((rows ?? []).map((row) => [row.id, row.slug ?? null]))
}

function idsByType(notifications: Notification[], types: string[]) {
  return Array.from(
    new Set(
      notifications
        .filter((notification) => types.includes(notification.target_type ?? ""))
        .map((notification) => notification.target_id)
        .filter((id): id is string => Boolean(id)),
    ),
  )
}

async function fetchSlugs(
  supabase: SupabaseClient,
  table: string,
  ids: string[],
) {
  if (ids.length === 0) return new Map<string, string | null>()

  const { data } = await supabase.from(table).select("id, slug").in("id", ids)

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

  const [materialSlugs, eventSlugs, tenderSlugs] = await Promise.all([
    fetchSlugs(supabase, "materials", materialIds),
    fetchSlugs(supabase, "events", eventIds),
    fetchSlugs(supabase, "tenders", tenderIds),
  ])

  return notifications.map((notification) => {
    const normalizedUrl = normalizeNotificationTargetUrl(notification.target_url)
    const targetType = notification.target_type ?? ""
    const targetId = notification.target_id
    const isAdminNotification = notification.type === "admin"

    if (normalizedUrl) {
      return { ...notification, target_url: normalizedUrl }
    }

    if (targetId && targetType === "event") {
      const slug = eventSlugs.get(targetId)
      return {
        ...notification,
        target_url: isAdminNotification
          ? `/admin/events/${targetId}/edit`
          : slug
            ? `/events/${slug}`
            : "/dashboard/notifications",
      }
    }

    if (targetId && (targetType === "tender" || targetType === "task")) {
      const slug = tenderSlugs.get(targetId)
      return {
        ...notification,
        target_url: slug ? `/tenders/${slug}` : "/dashboard/notifications",
      }
    }

    if (
      targetId &&
      (targetType === "case" || targetType === "article" || targetType === "material")
    ) {
      const slug = materialSlugs.get(targetId)
      return {
        ...notification,
        target_url: isAdminNotification
          ? `/admin/materials?target=${targetId}`
          : slug
            ? `/media/${slug}`
            : "/dashboard/notifications",
      }
    }

    return { ...notification, target_url: "/dashboard/notifications" }
  })
}
