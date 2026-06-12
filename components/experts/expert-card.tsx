import Link from "next/link"
import { ArrowUpRight, MapPin } from "lucide-react"

import { PublicViewCount } from "@/components/analytics/public-view-count"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { ReputationStats } from "@/components/reputation/reputation-stats"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ExpertProfile, ReputationSummary } from "@/types"

export function ExpertCard({
  expert,
  favoriteId,
  reputation,
  views,
}: {
  expert: ExpertProfile
  favoriteId?: string | null
  reputation?: ReputationSummary | null
  views?: number
}) {
  const name = [expert.first_name, expert.last_name].filter(Boolean).join(" ")

  return (
    <Card className="group flex h-full flex-col overflow-hidden shadow-elevation-1 transition-colors hover:border-primary/40">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {expert.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="h-full w-full object-cover"
                src={expert.avatar_url}
              />
            ) : (
              <span className="text-xl font-semibold">
                {expert.first_name.slice(0, 1)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl">{name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {expert.position ?? "Эксперт"}
            </p>
          </div>
          <FavoriteButton
            initialFavoriteId={favoriteId}
            targetId={expert.id}
            targetType="expert"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
          {expert.short_description ?? "Описание эксперта скоро появится."}
        </p>
        <div className="flex flex-wrap gap-2">
          {expert.city ? (
            <Badge className="gap-1" variant="outline">
              <MapPin className="size-3" />
              {expert.city}
            </Badge>
          ) : null}
          {expert.is_open_to_work ? (
            <Badge>Открыт к сотрудничеству</Badge>
          ) : null}
        </div>
        <ReputationStats
          compact
          href={`/@${expert.slug}#reputation`}
          summary={reputation}
        />
        <PublicViewCount views={views} />
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild className="w-full justify-between" variant="ghost">
          <Link href={`/@${expert.slug}`}>
            Открыть профиль
            <ArrowUpRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
