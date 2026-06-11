import Link from "next/link"
import { CalendarDays, MapPin } from "lucide-react"
import { PublicViewCount } from "@/components/analytics/public-view-count"
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

export function EventCard({ event, views }: { event: Event; views?: number }) {
  const isPromoted =
    event.is_promoted &&
    (!event.promoted_until || new Date(event.promoted_until) > new Date())
  const month = event.start_date
    ? new Date(event.start_date).toLocaleDateString("ru-RU", { month: "short" })
    : ""

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {event.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="h-44 w-full object-cover"
          src={event.cover_url}
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-secondary text-sm text-muted-foreground">
          {month}
        </div>
      )}
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          {isPromoted ? <Badge>Продвигается</Badge> : null}
          <Badge variant="outline">{eventTypeLabels[event.event_type]}</Badge>
          <Badge variant="outline">{eventFormatLabels[event.format]}</Badge>
        </div>
        <CardTitle>{event.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {event.description ?? "Описание события скоро появится."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {formatEventDate(event.start_date)}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {event.city ?? eventFormatLabels[event.format]}
        </div>
        <div>{event.owner_name ?? "SRCHR"}</div>
        <PublicViewCount views={views} />
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="outline">
          <Link href={`/events/${event.slug}`}>Открыть событие</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
