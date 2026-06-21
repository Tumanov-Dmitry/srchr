import Link from "next/link"
import { Bell } from "@/components/ui/icons"

import { NotificationReadButton } from "@/components/notifications/notification-read-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Уведомления"
          className="relative"
          size="icon"
          variant="ghost"
        >
          <Bell />
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 min-w-5 justify-center px-1.5 py-0.5 text-[10px] leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(92vw,360px)] overflow-hidden p-0"
      >
        <div className="px-4 py-3">
          <div className="font-semibold">Уведомления</div>
          <div className="text-xs text-muted-foreground">
            Непрочитанных: {unreadCount}
          </div>
        </div>
        <Separator />
        <div className="max-h-80 overflow-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const href = notification.target_url ?? "/dashboard/notifications"

              return (
                <div
                  className="block border-b px-4 py-3 text-sm transition-colors last:border-0 hover:bg-muted"
                  key={notification.id}
                >
                  <Link className="block" href={href}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium">{notification.title}</div>
                      {!notification.is_read ? (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
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
                  {!notification.is_read ? (
                    <div className="mt-2">
                      <NotificationReadButton id={notification.id} />
                    </div>
                  ) : null}
                </div>
              )
            })
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Уведомлений пока нет
            </div>
          )}
        </div>
        <Separator />
        <div className="p-2">
          <Button asChild className="w-full" size="sm" variant="outline">
            <Link href="/dashboard/notifications">Открыть все</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
