import Link from "next/link"
import { BookOpenText, RotateCcw, Search } from "lucide-react"

import { CatalogAnalyticsTracker } from "@/components/analytics/catalog-analytics-tracker"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { MaterialCard } from "@/components/media/material-card"
import { EmptyState } from "@/components/srchr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import {
  getFavoriteMarkers,
  getPublishedMaterials,
  type MaterialFilters,
} from "@/lib/supabase/queries"
import { getPublicViewCounts } from "@/lib/supabase/analytics-queries"

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<MaterialFilters>
}) {
  const filters = await searchParams
  const materials = await getPublishedMaterials(filters)
  const [favoriteMarkers, viewCounts] = await Promise.all([
    getFavoriteMarkers(
      materials.map((item) => ({ targetType: item.type, targetId: item.id })),
    ),
    getPublicViewCounts(
      "material",
      materials.map((item) => item.id),
    ),
  ])

  return (
    <PageShell>
      <CatalogAnalyticsTracker catalog="media" filters={filters} />
      <PageHeader
        description="Кейсы, статьи и экспертные материалы участников SRCHR."
        title="Медиа"
      />

      <Card className="mb-8 shadow-none">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_220px_auto]">
            <Input
              defaultValue={filters.q ?? ""}
              name="q"
              placeholder="Поиск по названию или описанию"
            />
            <FormSelect
              defaultValue={filters.type || undefined}
              name="type"
              options={[
                { value: "case", label: "Кейсы" },
                { value: "article", label: "Статьи" },
              ]}
              placeholder="Все типы"
            />
            <Input
              defaultValue={filters.category ?? ""}
              name="category"
              placeholder="Рубрика или услуга"
            />
            <div className="flex gap-2">
              <Button type="submit">
                <Search />
                Найти
              </Button>
              <Button asChild size="icon" variant="outline">
                <Link aria-label="Сбросить фильтры" href="/media">
                  <RotateCcw />
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {materials.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((item) => (
            <MaterialCard
              favoriteId={favoriteMarkers.get(`${item.type}:${item.id}`)}
              item={item}
              key={item.id}
              views={viewCounts.get(item.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Попробуйте изменить параметры поиска или загляните позже."
          icon={BookOpenText}
          title="Материалы не найдены"
        />
      )}
    </PageShell>
  )
}
