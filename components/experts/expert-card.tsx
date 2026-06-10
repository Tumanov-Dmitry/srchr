import Link from "next/link"
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
}: {
  expert: ExpertProfile
  favoriteId?: string | null
  reputation?: ReputationSummary | null
}) {
  const name = [expert.first_name, expert.last_name].filter(Boolean).join(" ")

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
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
            <CardTitle>{name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {expert.position ?? "Эксперт"}
            </p>
          </div>
          <FavoriteButton
            targetId={expert.id}
            targetType="expert"
            initialFavoriteId={favoriteId}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {expert.short_description ?? "Описание эксперта скоро появится."}
        </p>
        <div className="flex flex-wrap gap-2">
          {expert.city ? <Badge variant="outline">{expert.city}</Badge> : null}
          {expert.is_open_to_work ? (
            <Badge>Открыт к сотрудничеству</Badge>
          ) : null}
        </div>
        <ReputationStats
          compact
          href={`/@${expert.slug}#reputation`}
          summary={reputation}
        />
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="outline">
          <Link href={`/@${expert.slug}`}>Открыть профиль</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
