import Link from "next/link"
import { Building2, MapPin } from "@/components/ui/icons"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Recommendation = {
  id: string
  type: "contractor" | "expert"
  name: string
  description?: string | null
  city?: string | null
  imageUrl?: string | null
  href: string
  tags: string[]
}

type ClientRecommendedContractorsProps = {
  recommendations: Recommendation[]
}

export function ClientRecommendedContractors({
  recommendations,
}: ClientRecommendedContractorsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="type-h2">Рекомендованные исполнители</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Опубликованные агентства и эксперты, с которых можно начать поиск.
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/contractors">Открыть каталог</Link>
        </Button>
      </div>
      {recommendations.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {recommendations.slice(0, 4).map((item) => (
            <article
              className="rounded-lg border bg-card p-5"
              key={`${item.type}:${item.id}`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="size-11 rounded-lg">
                  <AvatarImage
                    alt={item.name}
                    src={item.imageUrl ?? undefined}
                  />
                  <AvatarFallback className="rounded-lg bg-muted">
                    {item.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold">{item.name}</h3>
                    <Badge variant="outline">
                      {item.type === "expert" ? "Эксперт" : "Агентство"}
                    </Badge>
                  </div>
                  {item.city ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {item.city}
                    </p>
                  ) : null}
                </div>
              </div>
              {item.description ? (
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
              {item.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <Button asChild className="mt-5" size="sm" variant="outline">
                <Link href={item.href}>Смотреть профиль</Link>
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Building2 className="mx-auto size-6 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">Подборка формируется</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Пока можно изучить исполнителей в общих каталогах.
          </p>
        </div>
      )}
    </section>
  )
}
