import Link from "next/link"
import { CalendarDays, MapPin, WalletCards } from "@/components/ui/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { PriceRequest } from "@/types"

const formatLabels = {
  online: "Онлайн",
  offline: "Офлайн",
  hybrid: "Гибрид",
}

export function PriceRequestCard({
  request,
  manage = false,
}: {
  request: PriceRequest
  manage?: boolean
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{request.service_category}</Badge>
          <Badge variant="outline">{formatLabels[request.format]}</Badge>
          {manage ? <Badge variant="secondary">{request.status}</Badge> : null}
        </div>
        <CardTitle className="text-xl">{request.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {request.description || "Описание пока не добавлено."}
        </p>
        <div className="grid gap-2 text-sm text-muted-foreground">
          {request.location ? (
            <span className="flex items-center gap-2">
              <MapPin className="size-4" />
              {request.location}
            </span>
          ) : null}
          {request.expected_deadline ? (
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              До{" "}
              {new Date(request.expected_deadline).toLocaleDateString("ru-RU")}
            </span>
          ) : null}
          <span className="flex items-center gap-2">
            <WalletCards className="size-4" />
            {request.responses_count ?? 0} оценок
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          className="w-full"
          variant={manage ? "outline" : "default"}
        >
          <Link
            href={
              manage
                ? `/price-requests/${request.id}/manage`
                : `/price-requests/${request.id}`
            }
          >
            {manage ? "Управлять" : "Открыть запрос"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
