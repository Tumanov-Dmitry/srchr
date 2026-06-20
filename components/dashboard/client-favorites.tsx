import Link from "next/link"
import { Heart } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import type { Favorite } from "@/types"

type ClientFavoritesProps = {
  favorites: Favorite[]
}

export function ClientFavorites({ favorites }: ClientFavoritesProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="type-h2">Избранное</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Последние сохранённые профили и материалы.
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/dashboard/favorites">Открыть всё</Link>
        </Button>
      </div>
      {favorites.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {favorites.slice(0, 6).map((favorite) => {
            const content = (
              <>
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {favorite.snapshot.object_type}
                </span>
                <h3 className="mt-3 line-clamp-2 font-semibold">
                  {favorite.snapshot.title}
                </h3>
                {favorite.snapshot.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {favorite.snapshot.description}
                  </p>
                ) : null}
              </>
            )
            return favorite.href && favorite.status === "active" ? (
              <Link
                className="w-56 shrink-0 rounded-lg border bg-card p-5 transition-colors hover:border-primary/40"
                href={favorite.href}
                key={favorite.id}
              >
                {content}
              </Link>
            ) : (
              <div
                className="w-56 shrink-0 rounded-lg border bg-muted/40 p-5"
                key={favorite.id}
              >
                {content}
                <p className="mt-3 text-xs text-muted-foreground">
                  Карточка недоступна
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Heart className="mx-auto size-6 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">В избранном пока ничего нет</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Сохраняйте подрядчиков и экспертов, чтобы быстро вернуться к ним.
          </p>
        </div>
      )}
    </section>
  )
}
