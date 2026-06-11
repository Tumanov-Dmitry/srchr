import { EventCard } from "@/components/events/event-card"
import { CatalogAnalyticsTracker } from "@/components/analytics/catalog-analytics-tracker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getPublishedEvents } from "@/lib/supabase/queries"
import { getPublicViewCounts } from "@/lib/supabase/analytics-queries"

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string
    city?: string
    format?: string
    event_type?: string
    tag?: string
  }>
}) {
  const filters = await searchParams
  const events = await getPublishedEvents(filters)
  const viewCounts = await getPublicViewCounts(
    "event",
    events.map((event) => event.id),
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <CatalogAnalyticsTracker catalog="events" filters={filters} />
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-normal">
            Мероприятия
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Конференции, вебинары, воркшопы и встречи для HR, экспертов и
            подрядчиков.
          </p>
        </div>
      </div>

      <form className="mb-8 grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-5">
        <Input
          defaultValue={filters.month ?? ""}
          name="month"
          placeholder="Месяц: 2026-06"
        />
        <Input
          defaultValue={filters.city ?? ""}
          name="city"
          placeholder="Город"
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          defaultValue={filters.format ?? ""}
          name="format"
        >
          <option value="">Все форматы</option>
          <option value="online">Онлайн</option>
          <option value="offline">Офлайн</option>
          <option value="hybrid">Гибрид</option>
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          defaultValue={filters.event_type ?? ""}
          name="event_type"
        >
          <option value="">Все типы</option>
          <option value="conference">Конференция</option>
          <option value="meetup">Митап</option>
          <option value="webinar">Вебинар</option>
          <option value="workshop">Воркшоп</option>
          <option value="education">Обучение</option>
          <option value="exhibition">Выставка</option>
          <option value="private_meeting">Закрытая встреча</option>
          <option value="other">Другое</option>
        </select>
        <div className="flex gap-2">
          <Input
            defaultValue={filters.tag ?? ""}
            name="tag"
            placeholder="Тег / категория"
          />
          <Button type="submit">Фильтр</Button>
        </div>
      </form>

      {events.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              event={event}
              key={event.id}
              views={viewCounts.get(event.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Подходящих мероприятий пока нет.
        </div>
      )}
    </div>
  )
}
