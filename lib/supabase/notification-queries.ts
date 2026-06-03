import { createClient } from "@/lib/supabase/server"
import { hydrateNotificationTargetUrls } from "@/lib/notification-targets"
import type {
  Notification,
  NotificationEvent,
  NotificationPreference,
} from "@/types"

export const notificationPreferenceGroups = [
  {
    category: "tasks",
    title: "Задачи",
    items: [
      ["task_created", "Новые задачи"],
      ["response_created", "Новые отклики"],
      ["response_status_changed", "Изменение статуса отклика"],
    ],
  },
  {
    category: "materials",
    title: "Материалы",
    items: [
      ["material_published", "Публикация"],
      ["material_rejected", "Отклонение"],
      ["material_moderation_comment", "Комментарии модерации"],
    ],
  },
  {
    category: "events",
    title: "События",
    items: [
      ["event_published", "Публикация"],
      ["event_rejected", "Отклонение"],
      ["event_participation_changed", "Участие пользователей"],
    ],
  },
  {
    category: "organizations",
    title: "Организации",
    items: [
      ["organization_invite_created", "Приглашения"],
      ["organization_role_changed", "Изменение роли"],
    ],
  },
  {
    category: "subscriptions",
    title: "Подписки",
    items: [
      ["subscription_expiring", "Окончание подписки"],
      ["subscription_payment_success", "Успешная оплата"],
      ["subscription_payment_failed", "Ошибки оплаты"],
    ],
  },
  {
    category: "system",
    title: "Системные",
    items: [
      ["platform_news", "Новости платформы"],
      ["admin_announcement", "Объявления администрации"],
    ],
  },
] as const

function isMissingTable(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? ""
  return (
    error?.code === "42P01" ||
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  )
}

export async function getUserNotifications(limit = 50) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      notifications: [] as Notification[],
      unreadCount: 0,
      isNotificationsTableMissing: false,
    }
  }

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false),
  ])

  const notifications = error
    ? []
    : await hydrateNotificationTargetUrls(
        supabase,
        (data ?? []) as Notification[],
      )

  return {
    user,
    notifications,
    unreadCount: countError ? 0 : (count ?? 0),
    isNotificationsTableMissing: isMissingTable(error) || isMissingTable(countError),
  }
}

export async function getNotificationPreferences() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      preferences: [] as NotificationPreference[],
      isNotificationsTableMissing: false,
    }
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)

  return {
    user,
    preferences: error ? [] : ((data ?? []) as NotificationPreference[]),
    isNotificationsTableMissing: isMissingTable(error),
  }
}

export async function getAdminNotificationEvents(severity?: string | null) {
  const supabase = await createClient()
  const since = new Date()
  since.setDate(since.getDate() - 30)

  let query = supabase
    .from("notification_events")
    .select("*")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(200)

  if (severity && severity !== "all") {
    query = query.eq("severity", severity)
  }

  const { data, error } = await query

  return {
    events: error ? [] : ((data ?? []) as NotificationEvent[]),
    isNotificationsTableMissing: isMissingTable(error),
  }
}
