import Link from "next/link"
import { ImageOff, Pin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FavoriteCardActions } from "@/components/favorites/favorite-card-actions"
import { favoriteTypeLabels } from "@/lib/favorites"
import { formatDate } from "@/lib/utils"
import type { Favorite } from "@/types"

export function FavoriteCard({ favorite }: { favorite: Favorite }) {
  const isActive = favorite.status === "active" && Boolean(favorite.href)
  const body = (
    <>
      {favorite.snapshot.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="h-40 w-full object-cover"
          src={favorite.snapshot.image}
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-secondary text-muted-foreground">
          <ImageOff className="h-6 w-6" />
        </div>
      )}
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{favoriteTypeLabels[favorite.target_type]}</Badge>
          {favorite.is_pinned ? (
            <Badge variant="outline">
              <Pin className="mr-1 h-3 w-3" /> Закреплено
            </Badge>
          ) : null}
          {!isActive ? <Badge variant="outline">Недоступно</Badge> : null}
        </div>
        <div>
          <CardTitle className="line-clamp-2">
            {favorite.snapshot.title}
          </CardTitle>
          {favorite.snapshot.subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {favorite.snapshot.subtitle}
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
        <p className="line-clamp-3">
          {favorite.snapshot.description ??
            "Описание сохраненного объекта не указано."}
        </p>
        {!isActive ? (
          <p className="rounded-md bg-secondary p-3 text-foreground">
            {favorite.target_type === "case" ||
            favorite.target_type === "article"
              ? "Материал больше не опубликован"
              : "Карточка недоступна"}
          </p>
        ) : null}
        <p>Добавлено: {formatDate(favorite.created_at)}</p>
      </CardContent>
    </>
  )

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {isActive ? <Link href={favorite.href ?? "#"}>{body}</Link> : body}
      <CardFooter>
        <FavoriteCardActions
          favoriteId={favorite.id}
          isPinned={favorite.is_pinned}
        />
      </CardFooter>
    </Card>
  )
}
