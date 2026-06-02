import Link from "next/link"
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
}: {
  item: Material
  favoriteId?: string | null
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {item.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-44 w-full object-cover" src={item.cover_url} />
      ) : (
        <div className="h-44 bg-secondary" />
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="w-fit">
              {typeLabels[item.type] ?? item.type}
            </Badge>
            {item.category ? (
              <Badge variant="outline">{item.category}</Badge>
            ) : null}
          </div>
          <FavoriteButton
            targetId={item.id}
            targetType={item.type}
            initialFavoriteId={favoriteId}
          />
        </div>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {item.description ?? "Описание материала скоро появится."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 text-sm text-muted-foreground">
        {item.organizations?.name ?? item.author ?? "SRCHR"}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="outline">
          <Link href={`/media/${item.slug}`}>Открыть материал</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
