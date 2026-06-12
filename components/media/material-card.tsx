import Link from "next/link"
import { ArrowUpRight, BookOpenText } from "@/components/ui/icons"

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
import type { Material } from "@/types"

const typeLabels: Record<string, string> = {
  case: "Кейс",
  article: "Статья",
}

export function MaterialCard({
  item,
  favoriteId,
  views,
}: {
  item: Material
  favoriteId?: string | null
  views?: number
}) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden shadow-elevation-1 transition-colors hover:border-primary/40">
      {item.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          src={item.cover_url}
        />
      ) : (
        <div className="grid aspect-[16/9] place-items-center bg-srchr-pink/15">
          <BookOpenText className="size-8 text-muted-foreground" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{typeLabels[item.type] ?? item.type}</Badge>
            {item.category ? (
              <Badge variant="outline">{item.category}</Badge>
            ) : null}
          </div>
          <FavoriteButton
            initialFavoriteId={favoriteId}
            targetId={item.id}
            targetType={item.type}
          />
        </div>
        <CardTitle className="text-xl leading-snug">{item.title}</CardTitle>
        <CardDescription className="line-clamp-3 min-h-[4.5rem] leading-6">
          {item.description ?? "Описание материала скоро появится."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-end justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {item.expert_profiles
            ? [item.expert_profiles.first_name, item.expert_profiles.last_name]
                .filter(Boolean)
                .join(" ")
            : (item.organizations?.name ?? item.author ?? "SRCHR")}
        </span>
        <PublicViewCount views={views} />
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild className="w-full justify-between" variant="ghost">
          <Link href={`/media/${item.slug}`}>
            Читать материал
            <ArrowUpRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
