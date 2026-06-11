import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarDays, ExternalLink, MapPin, Send } from "lucide-react"
import { AnalyticsLink } from "@/components/analytics/analytics-link"
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker"
import { PublicViewCount } from "@/components/analytics/public-view-count"
import { EventParticipationForm } from "@/components/events/event-participation-form"
import {
  eventFormatLabels,
  eventTypeLabels,
  formatEventDate,
} from "@/components/events/event-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getCurrentUser, getPublishedEventBySlug } from "@/lib/supabase/queries"
import { getPublicViewCount } from "@/lib/supabase/analytics-queries"

function splitList(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const { slug } = await params
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const event = await getPublishedEventBySlug(slug)
  const user = await getCurrentUser()

  if (!event) notFound()
  const views = await getPublicViewCount("event", event.id)

  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://srchr.ru"}/events/${event.slug}`
  const qrDestination = `/analytics/qr/event/${event.id}?to=${encodeURIComponent(`/events/${event.slug}`)}`
  const qrTrackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://srchr.ru"}${qrDestination}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrTrackingUrl)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(event.title)}`
  const speakers = splitList(event.speakers)
  const tags = splitList(event.tags)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <AnalyticsTracker
        eventType="event_view"
        source="event_page"
        targetId={event.id}
        targetType="event"
      />
      {message ? (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <main className="space-y-6">
          {event.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="aspect-[16/7] w-full rounded-lg object-cover"
              src={event.cover_url}
            />
          ) : (
            <div className="aspect-[16/7] rounded-lg bg-secondary" />
          )}

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{eventTypeLabels[event.event_type]}</Badge>
              <Badge variant="outline">{eventFormatLabels[event.format]}</Badge>
              {event.is_promoted ? (
                <Badge variant="outline">Продвигается</Badge>
              ) : null}
            </div>
            <h1 className="text-4xl font-semibold tracking-normal">
              {event.title}
            </h1>
            <PublicViewCount views={views} />
            <p className="whitespace-pre-line text-lg text-muted-foreground">
              {event.description}
            </p>
          </div>

          {speakers.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Спикеры</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {speakers.map((speaker) => (
                  <Badge key={speaker} variant="outline">
                    {speaker}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {tags.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Теги</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </main>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Детали</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div>{formatEventDate(event.start_date)}</div>
                  {event.end_date ? (
                    <div className="text-muted-foreground">
                      до {formatEventDate(event.end_date)}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div>{event.city ?? eventFormatLabels[event.format]}</div>
                  {event.address ? (
                    <div className="text-muted-foreground">{event.address}</div>
                  ) : null}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Организатор</div>
                <div className="font-medium">{event.owner_name ?? "SRCHR"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Стоимость</div>
                <div className="font-medium">
                  {event.price_type === "free" ? "Бесплатно" : "Платно"}
                </div>
                {event.price_note ? (
                  <div className="text-muted-foreground">
                    {event.price_note}
                  </div>
                ) : null}
              </div>
              {event.external_url ? (
                <Button asChild className="w-full">
                  <AnalyticsLink
                    eventType="event_registration_click"
                    href={event.external_url}
                    rel="noreferrer"
                    source="event_registration"
                    target="_blank"
                    targetId={event.id}
                    targetType="event"
                  >
                    Регистрация <ExternalLink className="h-4 w-4" />
                  </AnalyticsLink>
                </Button>
              ) : null}
              <Button asChild className="w-full" variant="outline">
                <Link href={`/events/${event.slug}/ics`}>
                  Добавить в календарь
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Участие</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <EventParticipationForm
                  currentStatus={event.my_participation}
                  eventId={event.id}
                  slug={event.slug}
                />
              ) : (
                <Button asChild variant="outline">
                  <Link href="/login">Войдите, чтобы отметить участие</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR и шаринг</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="QR события"
                className="h-44 w-44 rounded-md border bg-white p-2"
                src={qrUrl}
              />
              <Button asChild variant="outline">
                <AnalyticsLink
                  eventType="telegram_share"
                  href={telegramUrl}
                  rel="noreferrer"
                  source="event_share"
                  target="_blank"
                  targetId={event.id}
                  targetType="event"
                >
                  Поделиться в Telegram <Send className="h-4 w-4" />
                </AnalyticsLink>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
