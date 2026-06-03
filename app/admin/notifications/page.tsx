import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminNotificationEvents } from "@/lib/supabase/notification-queries"

export default async function AdminNotificationsPage() {
  const { events, isNotificationsTableMissing } = await getAdminNotificationEvents()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Notifications</h1>
        <p className="mt-2 text-muted-foreground">
          Системный журнал событий платформы за последние 30 дней.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Events</CardTitle>
        </CardHeader>
        <CardContent>
          {isNotificationsTableMissing ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Примените SQL из supabase/sql/create-notifications.sql.
            </div>
          ) : events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-3 pr-4">Событие</th>
                    <th className="py-3 pr-4">Источник</th>
                    <th className="py-3 pr-4">Цель</th>
                    <th className="py-3 pr-4">Уровень</th>
                    <th className="py-3 pr-4">Статус</th>
                    <th className="py-3 pr-4">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr className="border-b last:border-0" key={event.id}>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{event.event_key}</div>
                        <div className="max-w-md truncate text-xs text-muted-foreground">
                          {event.title ?? event.text ?? "Без описания"}
                        </div>
                      </td>
                      <td className="py-3 pr-4">{event.source ?? "srchr"}</td>
                      <td className="py-3 pr-4">
                        {[event.target_type, event.target_id].filter(Boolean).join(": ") || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge>{event.severity}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{event.status}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {event.created_at
                          ? new Date(event.created_at).toLocaleString("ru-RU")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Событий пока нет.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
