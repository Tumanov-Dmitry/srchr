import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUserNotifications } from "@/lib/supabase/notification-queries"

function formatDate(value?: string | null) {
  if (!value) return ""

  return new Date(value).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  })
}

export async function NotificationBell() {
  const { user, notifications, unreadCount, isNotificationsTableMissing } =
    await getUserNotifications(5)

  if (!user || isNotificationsTableMissing) return null

  return (
    <details className="relative">
      <summary
        aria-label="Уведомления"
        className="relative inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground [&::-webkit-details-marker]:hidden"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </summary>
      <div className="fixed left-4 right-4 top-16 z-50 max-h-[calc(100vh-5rem)] overflow-hidden rounded-lg border bg-background shadow-lg md:absolute md:left-auto md:right-0 md:top-auto md:mt-2 md:w-80">
        <div className="border-b px-4 py-3">
          <div className="font-medium">Уведомления</div>
          <div className="text-xs text-muted-foreground">
            Непрочитанных: {unreadCount}
          </div>
        </div>
        <div className="max-h-80 overflow-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <Link
                className="block border-b px-4 py-3 text-sm last:border-0 hover:bg-accent"
                href={`/notifications/${notification.id}/open`}
                key={notification.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{notification.title}</div>
                  {!notification.is_read ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </div>
                {notification.text ? (
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {notification.text}
                  </div>
                ) : null}
                <div className="mt-2 text-xs text-muted-foreground">
                  {formatDate(notification.created_at)}
                </div>
              </Link>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              Уведомлений пока нет.
            </div>
          )}
        </div>
        <div className="border-t p-2">
          <Button asChild className="w-full" size="sm" variant="outline">
            <Link href="/notifications">Открыть все</Link>
          </Button>
        </div>
      </div>
    </details>
  )
}
