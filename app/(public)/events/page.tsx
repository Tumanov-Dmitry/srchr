import Link from "next/link"
import { CalendarDays, RotateCcw, Search } from "@/components/ui/icons"

import { CatalogAnalyticsTracker } from "@/components/analytics/catalog-analytics-tracker"
import { EventCard } from "@/components/events/event-card"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { EmptyState } from "@/components/srchr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { getPublicViewCounts } from "@/lib/supabase/analytics-queries"
import { getFavoriteMarkers, getPublishedEvents } from "@/lib/supabase/queries"

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
  const [viewCounts, favoriteMarkers] = await Promise.all([
    getPublicViewCounts(
      "event",
      events.map((event) => event.id),
    ),
    getFavoriteMarkers(
      events.map((event) => ({
        targetType: "event" as const,
        targetId: event.id,
      })),
    ),
  ])

  return (
    <PageShell>
      <CatalogAnalyticsTracker catalog="events" filters={filters} />
      <PageHeader
        description="Конференции, вебинары, воркшопы и встречи для HR, экспертов и подрядчиков."
        title="Мероприятия"
      />

      <Card className="mb-8 shadow-none">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[160px_1fr_180px_190px_1fr_auto]">
            <Input
              defaultValue={filters.month ?? ""}
              name="month"
              placeholder="2026-06"
              type="month"
            />
            <Input
              defaultValue={filters.city ?? ""}
              name="city"
              placeholder="Город"
            />
            <FormSelect
              defaultValue={filters.format || undefined}
              name="format"
              options={[
                { value: "online", label: "Онлайн" },
                { value: "offline", label: "Офлайн" },
                { value: "hybrid", label: "Гибрид" },
              ]}
              placeholder="Все форматы"
            />
            <FormSelect
              defaultValue={filters.event_type || undefined}
              name="event_type"
              options={[
                { value: "conference", label: "Конференция" },
                { value: "meetup", label: "Митап" },
                { value: "webinar", label: "Вебинар" },
                { value: "workshop", label: "Воркшоп" },
                { value: "education", label: "Обучение" },
                { value: "exhibition", label: "Выставка" },
                { value: "private_meeting", label: "Закрытая встреча" },
                { value: "other", label: "Другое" },
              ]}
              placeholder="Все типы"
            />
            <Input
              defaultValue={filters.tag ?? ""}
              name="tag"
              placeholder="Тег или категория"
            />
            <div className="flex gap-2">
              <Button type="submit">
                <Search />
                Найти
              </Button>
              <Button asChild size="icon" variant="outline">
                <Link aria-label="Сбросить фильтры" href="/events">
                  <RotateCcw />
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {events.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              event={event}
              initialFavoriteId={favoriteMarkers.get(`event:${event.id}`)}
              key={event.id}
              views={viewCounts.get(event.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Попробуйте изменить фильтры или выбрать другой месяц."
          icon={CalendarDays}
          title="Подходящих мероприятий пока нет"
        />
      )}
    </PageShell>
  )
}
