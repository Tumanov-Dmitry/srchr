import { BellRing } from "@/components/ui/icons"

import { EmptyState } from "@/components/srchr"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAdminNotificationEvents } from "@/lib/supabase/notification-queries"

export default async function AdminNotificationsPage() {
  const { events, isNotificationsTableMissing } =
    await getAdminNotificationEvents()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1">Notifications</h1>
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
            <EmptyState
              description="Примените SQL-патч уведомлений."
              icon={BellRing}
              title="Таблица уведомлений недоступна"
            />
          ) : events.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Событие</TableHead>
                    <TableHead>Источник</TableHead>
                    <TableHead>Цель</TableHead>
                    <TableHead>Уровень</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">{event.event_key}</div>
                        <div className="max-w-md truncate text-xs text-muted-foreground">
                          {event.title ?? event.text ?? "Без описания"}
                        </div>
                      </TableCell>
                      <TableCell>{event.source ?? "srchr"}</TableCell>
                      <TableCell>
                        {[event.target_type, event.target_id]
                          .filter(Boolean)
                          .join(": ") || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge>{event.severity}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {event.created_at
                          ? new Date(event.created_at).toLocaleString("ru-RU")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              description="Новые события появятся здесь автоматически."
              icon={BellRing}
              title="Событий пока нет"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
