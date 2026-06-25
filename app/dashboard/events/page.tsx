import Link from "next/link"
import { EventCard, eventStatusLabels } from "@/components/events/event-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getDashboardEvents } from "@/lib/supabase/queries"

export default async function DashboardEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const { events, participations, isEventsTableMissing } = await getDashboardEvents()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="type-h1">Мероприятия</h1>
          <p className="type-body mt-2 text-muted-foreground">
            Созданные события, события организаций и отметки участия.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">Создать событие</Link>
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      {isEventsTableMissing ? (
        <Card>
          <CardHeader>
            <CardTitle>Нужны таблицы events и event_participants</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Примените SQL из supabase/sql/create-events.sql, чтобы включить модуль мероприятий.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Мои события</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="divide-y">
              {events.map((event) => (
                <div
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                  key={event.id}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{eventStatusLabels[event.status] ?? event.status}</Badge>
                      <Badge variant="outline">{event.owner_name ?? event.owner_type}</Badge>
                    </div>
                    <div>
                      <h2 className="font-medium">{event.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {event.start_date
                          ? new Date(event.start_date).toLocaleString("ru-RU")
                          : "Дата не указана"}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/events/${event.id}/edit`}>Редактировать</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Событий пока нет.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Я участвую</CardTitle>
        </CardHeader>
        <CardContent>
          {participations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {participations
                .filter((participation) => participation.events)
                .map((participation) => (
                  <div className="space-y-3 rounded-lg border p-4" key={participation.id}>
                    <Badge variant="outline">{participation.status}</Badge>
                    <EventCard event={participation.events!} />
                  </div>
                ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Вы пока не отмечали участие в мероприятиях.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
