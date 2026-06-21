import Link from "next/link"
import { markNotificationRead } from "@/app/actions/notifications"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/types"

export function NotificationList({
  notifications,
  returnPath = "/dashboard/notifications",
}: {
  notifications: Notification[]
  returnPath?: string
}) {
  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Уведомлений за последние 30 дней пока нет.
      </div>
    )
  }

  return (
    <div className="divide-y rounded-lg border bg-background">
      {notifications.map((notification) => {
        const href = notification.target_url ?? "/dashboard/notifications"

        return (
          <div
            className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between"
            key={notification.id}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={notification.is_read ? "outline" : "default"}>
                  {notification.is_read ? "Прочитано" : "Новое"}
                </Badge>
                <Badge variant="outline">{notification.type}</Badge>
                <span className="text-xs text-muted-foreground">
                  {notification.created_at
                    ? new Date(notification.created_at).toLocaleString("ru-RU")
                    : ""}
                </span>
              </div>
              <div>
                <Link className="font-medium hover:text-primary" href={href}>
                  {notification.title}
                </Link>
                {notification.text ? (
                  <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                    {notification.text}
                  </p>
                ) : null}
                <div className="mt-2 text-xs text-muted-foreground">
                  Источник: {href}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={href}>Открыть источник</Link>
              </Button>
              {!notification.is_read ? (
                <form action={markNotificationRead}>
                  <input name="id" type="hidden" value={notification.id} />
                  <input name="path" type="hidden" value={returnPath} />
                  <Button size="sm" type="submit" variant="ghost">
                    ОК
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
