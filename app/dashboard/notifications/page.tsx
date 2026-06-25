import { markAllNotificationsRead } from "@/app/actions/notifications"
import { NotificationList } from "@/components/notifications/notification-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getUserNotifications } from "@/lib/supabase/notification-queries"

export default async function DashboardNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const { notifications, unreadCount, isNotificationsTableMissing } =
    await getUserNotifications(100)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="type-h1">Уведомления</h1>
          <p className="type-body mt-2 text-muted-foreground">
            История уведомлений за последние 30 дней.
          </p>
        </div>
        {unreadCount > 0 ? (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline">
              Отметить все прочитанными
            </Button>
          </form>
        ) : null}
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      {isNotificationsTableMissing ? (
        <Card>
          <CardHeader>
            <CardTitle>Нужны таблицы уведомлений</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Примените SQL из supabase/sql/create-notifications.sql, чтобы включить
            модуль уведомлений.
          </CardContent>
        </Card>
      ) : (
        <NotificationList
          notifications={notifications}
          returnPath="/dashboard/notifications"
        />
      )}
    </div>
  )
}
