import Link from "next/link"
import {
  updateAdminEventPromotion,
  updateAdminEventStatus,
} from "@/app/actions/admin"
import { eventFormatLabels, eventStatusLabels, eventTypeLabels } from "@/components/events/event-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { decodeMessage } from "@/lib/messages"
import { getAdminEvents } from "@/lib/supabase/admin-queries"

const statuses = [
  "all",
  "draft",
  "moderation",
  "published",
  "rejected",
  "archived",
  "cancelled",
  "completed",
]

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
        <h1 className="text-3xl font-semibold tracking-normal">Мероприятия</h1>
        <p className="mt-2 text-muted-foreground">
          Модерация, статусы и ручное продвижение событий.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <form className="flex max-w-xs gap-2">
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue={status ?? "all"}
          name="status"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "Все статусы" : eventStatusLabels[item]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Фильтр
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Список событий</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-3 pr-4">Событие</th>
                    <th className="py-3 pr-4">Тип</th>
                    <th className="py-3 pr-4">Дата</th>
                    <th className="py-3 pr-4">Статус</th>
                    <th className="py-3 pr-4">Промо</th>
                    <th className="py-3 pr-4">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr className="border-b last:border-0" key={event.id}>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{event.title}</div>
                        <div className="max-w-md truncate text-xs text-muted-foreground">
                          {event.city ?? eventFormatLabels[event.format]} · {event.slug}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{eventTypeLabels[event.event_type]}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {event.start_date
                          ? new Date(event.start_date).toLocaleString("ru-RU")
                          : "Дата не указана"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge>{eventStatusLabels[event.status] ?? event.status}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <form action={updateAdminEventPromotion} className="grid gap-2">
                          <input name="id" type="hidden" value={event.id} />
                          <label className="flex items-center gap-2">
                            <input
                              defaultChecked={Boolean(event.is_promoted)}
                              name="is_promoted"
                              type="checkbox"
                            />
                            Продвигать
                          </label>
                          <Input
                            defaultValue={event.promoted_until?.slice(0, 16) ?? ""}
                            name="promoted_until"
                            type="datetime-local"
                          />
                          <Input
                            defaultValue={event.promotion_url ?? ""}
                            name="promotion_url"
                            placeholder="promotion_url"
                          />
                          <Button size="sm" type="submit" variant="outline">
                            Сохранить промо
                          </Button>
                        </form>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/events/${event.id}/edit`}>Открыть</Link>
                          </Button>
                          <form action={updateAdminEventStatus} className="flex gap-2">
                            <input name="id" type="hidden" value={event.id} />
                            <select
                              className="h-9 rounded-md border border-input bg-background px-2"
                              defaultValue={event.status}
                              name="status"
                            >
                              {statuses
                                .filter((item) => item !== "all")
                                .map((item) => (
                                  <option key={item} value={item}>
                                    {eventStatusLabels[item]}
                                  </option>
                                ))}
                            </select>
                            <Button size="sm" type="submit">
                              Статус
                            </Button>
                          </form>
                        </div>
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
