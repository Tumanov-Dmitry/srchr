import { ArrowUpRight, CalendarDays, MapPin } from "@/components/ui/icons"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

type EventCardProps = {
  title: string
  date: string
  location: string
  organizer: string
  organizerAvatarUrl?: string
  format?: string
  promoted?: boolean
}

export function EventCard({
  title,
  date,
  location,
  organizer,
  organizerAvatarUrl,
  format,
  promoted = false,
}: EventCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-elevation-1">
      <div className="flex min-h-32 flex-col justify-between bg-primary p-5 text-primary-foreground">
        <div className="flex items-start justify-between gap-3">
          {format ? (
            <Badge className="border-white/30 bg-white/15 text-white">
              {format}
            </Badge>
          ) : (
            <span />
          )}
          {promoted ? (
            <Badge className="bg-srchr-yellow text-foreground">
              Продвигается
            </Badge>
          ) : null}
        </div>
        <CalendarDays className="size-8" />
      </div>
      <CardContent className="flex-1 space-y-5 pt-6">
        <h3 className="text-xl font-semibold leading-snug">{title}</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            {date}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4" />
            {location}
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t pt-4">
        <span className="flex min-w-0 items-center gap-2 text-sm">
          <Avatar className="size-7">
            <AvatarImage src={organizerAvatarUrl} alt={organizer} />
            <AvatarFallback>{organizer.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="truncate">{organizer}</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Открыть событие ${title}`}
        >
          <ArrowUpRight />
        </Button>
      </CardFooter>
    </Card>
  )
}
