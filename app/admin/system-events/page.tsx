import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SelectField } from "@/components/ui/select-field"
import { getAdminNotificationEvents } from "@/lib/supabase/notification-queries"

const severities = ["all", "warning", "error", "critical"]

export default async function AdminSystemEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string }>
}) {
  const { severity } = await searchParams
  const { events, isNotificationsTableMissing } =
    await getAdminNotificationEvents(severity)
  const systemEvents = events.filter((event) =>
    ["warning", "error", "critical"].includes(event.severity),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">
          System Events
        </h1>
        <p className="mt-2 text-muted-foreground">
          Предупреждения, ошибки и критические события платформы.
        </p>
      </div>

      <form className="flex max-w-xs gap-2">
        <SelectField
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue={severity ?? "all"}
          name="severity"
        >
          {severities.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "Все уровни" : item}
            </option>
          ))}
        </SelectField>
        <Button type="submit" variant="outline">
          Фильтр
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Центр ошибок</CardTitle>
        </CardHeader>
        <CardContent>
          {isNotificationsTableMissing ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Примените SQL из supabase/sql/create-notifications.sql.
            </div>
          ) : systemEvents.length > 0 ? (
            <div className="divide-y rounded-lg border">
              {systemEvents.map((event) => (
                <div
                  className="grid gap-3 p-4 md:grid-cols-[140px_1fr_140px]"
                  key={event.id}
                >
                  <div>
                    <Badge>{event.severity}</Badge>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {event.source ?? "srchr"}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">
                      {event.title ?? event.event_key}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {event.text ?? "Описание не указано"}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <Badge variant="outline">{event.status}</Badge>
                    <div className="mt-2">
                      {event.created_at
                        ? new Date(event.created_at).toLocaleString("ru-RU")
                        : "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Ошибок за последние 30 дней нет.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
