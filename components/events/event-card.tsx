import Link from "next/link"
import { ArrowUpRight, CalendarDays, MapPin } from "@/components/ui/icons"

import { PublicViewCount } from "@/components/analytics/public-view-count"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Event } from "@/types"

export const eventTypeLabels: Record<string, string> = {
  conference: "Конференция",
  meetup: "Митап",
  webinar: "Вебинар",
  workshop: "Воркшоп",
  education: "Обучение",
  exhibition: "Выставка",
  private_meeting: "Закрытая встреча",
  other: "Другое",
}

export const eventFormatLabels: Record<string, string> = {
  online: "Онлайн",
  offline: "Офлайн",
  hybrid: "Гибрид",
}

export const eventStatusLabels: Record<string, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликовано",
  rejected: "На доработке",
  archived: "Архив",
  cancelled: "Отменено",
  completed: "Завершено",
}

export function formatEventDate(value?: string | null) {
  if (!value) return "Дата не указана"

  return new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function EventCard({
  event,
  views,
  initialFavoriteId,
}: {
  event: Event
  views?: number
  initialFavoriteId?: string | null
}) {
  const isPromoted =
    event.is_promoted &&
    (!event.promoted_until || new Date(event.promoted_until) > new Date())
  const month = event.start_date
    ? new Date(event.start_date).toLocaleDateString("ru-RU", { month: "short" })
    : ""

  return (
    <Card className="group flex h-full flex-col overflow-hidden shadow-elevation-1 transition-colors hover:border-primary/40">
      {event.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          src={event.cover_url}
        />
      ) : (
        <div className="flex aspect-[16/9] flex-col items-center justify-center bg-primary text-primary-foreground">
          <CalendarDays className="mb-2 size-8" />
          <span className="text-lg font-semibold uppercase">{month}</span>
        </div>
      )}
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          {isPromoted ? (
            <Badge className="bg-srchr-yellow text-foreground">
              Продвигается
            </Badge>
          ) : null}
          <Badge variant="outline">{eventTypeLabels[event.event_type]}</Badge>
          <Badge variant="outline">{eventFormatLabels[event.format]}</Badge>
        </div>
        <CardTitle className="text-xl leading-snug">{event.title}</CardTitle>
        <CardDescription className="line-clamp-3 min-h-[4.5rem] leading-6">
          {event.description ?? "Описание события скоро появится."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4" />
          {formatEventDate(event.start_date)}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4" />
          {event.city ?? eventFormatLabels[event.format]}
        </div>
        <div>{event.owner_name ?? "SRCHR"}</div>
        <PublicViewCount views={views} />
      </CardContent>
      <CardFooter className="gap-2 border-t pt-4">
        <Button asChild className="w-full justify-between" variant="ghost">
          <Link href={`/events/${event.slug}`}>
            Открыть событие
            <ArrowUpRight />
          </Link>
        </Button>
        <FavoriteButton
          initialFavoriteId={initialFavoriteId}
          targetId={event.id}
          targetType="event"
        />
      </CardFooter>
    </Card>
  )
}
