import Link from "next/link"
import { CalendarDays } from "lucide-react"

import {
  updateAdminEventPromotion,
  updateAdminEventStatus,
} from "@/app/actions/admin"
import { AdminStatusForm } from "@/components/admin/status-form"
import {
  eventFormatLabels,
  eventStatusLabels,
  eventTypeLabels,
} from "@/components/events/event-card"
import { EmptyState } from "@/components/srchr"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { decodeMessage } from "@/lib/messages"
import { getAdminEvents } from "@/lib/supabase/admin-queries"

const statuses = [
  "draft",
  "moderation",
  "published",
  "rejected",
  "archived",
  "cancelled",
  "completed",
]
const statusOptions = statuses.map((status) => ({
  value: status,
  label: eventStatusLabels[status],
}))

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; status?: string }>
}) {
  const { message: rawMessage, status } = await searchParams
  const message = decodeMessage(rawMessage)
  const events = await getAdminEvents(status)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1">Мероприятия</h1>
        <p className="mt-2 text-muted-foreground">
          Модерация, статусы и ручное продвижение событий.
        </p>
      </div>
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <Card className="max-w-sm shadow-none">
        <CardContent className="p-3">
          <form className="flex gap-2">
            <FormSelect
              className="flex-1"
              defaultValue={status ?? "all"}
              name="status"
              options={[
                { value: "all", label: "Все статусы" },
                ...statusOptions,
              ]}
            />
            <Button type="submit" variant="outline">
              Фильтр
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Список событий</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[1180px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Событие</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Продвижение</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">{event.title}</div>
                        <div className="max-w-md truncate text-xs text-muted-foreground">
                          {event.city ?? eventFormatLabels[event.format]} ·{" "}
                          {event.slug}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {eventTypeLabels[event.event_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {event.start_date
                          ? new Date(event.start_date).toLocaleString("ru-RU")
                          : "Дата не указана"}
                      </TableCell>
                      <TableCell>
                        <Badge>
                          {eventStatusLabels[event.status] ?? event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <form
                          action={updateAdminEventPromotion}
                          className="grid min-w-60 gap-2"
                        >
                          <input name="id" type="hidden" value={event.id} />
                          <div className="flex items-center gap-2">
                            <Checkbox
                              defaultChecked={Boolean(event.is_promoted)}
                              id={`promoted-${event.id}`}
                              name="is_promoted"
                            />
                            <Label htmlFor={`promoted-${event.id}`}>
                              Продвигать
                            </Label>
                          </div>
                          <Input
                            defaultValue={
                              event.promoted_until?.slice(0, 16) ?? ""
                            }
                            name="promoted_until"
                            type="datetime-local"
                          />
                          <Input
                            defaultValue={event.promotion_url ?? ""}
                            name="promotion_url"
                            placeholder="Ссылка продвижения"
                          />
                          <Button size="sm" type="submit" variant="outline">
                            Сохранить промо
                          </Button>
                        </form>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/events/${event.id}/edit`}>
                              Открыть
                            </Link>
                          </Button>
                          <AdminStatusForm
                            action={updateAdminEventStatus}
                            defaultValue={event.status}
                            id={event.id}
                            options={statusOptions}
                            submitLabel="Статус"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              description="Измените фильтр или дождитесь новых событий."
              icon={CalendarDays}
              title="Событий пока нет"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
