import Link from "next/link"
import { CatalogAnalyticsTracker } from "@/components/analytics/catalog-analytics-tracker"
import { MaterialCard } from "@/components/media/material-card"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getFavoriteMarkers,
  getPublishedMaterials,
  type MaterialFilters,
} from "@/lib/supabase/queries"
import { getPublicViewCounts } from "@/lib/supabase/analytics-queries"

const typeOptions = [
  { value: "", label: "Все типы" },
  { value: "case", label: "Кейсы" },
  { value: "article", label: "Статьи" },
]

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
        title="Медиа"
        description="Кейсы, статьи и экспертные материалы участников SRCHR."
      />

      <form className="mb-8 grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-[1fr_180px_220px_auto]">
        <Input
          defaultValue={filters.q ?? ""}
          name="q"
          placeholder="Поиск по названию или описанию"
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          defaultValue={filters.type ?? ""}
          name="type"
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Input
          defaultValue={filters.category ?? ""}
          name="category"
          placeholder="Рубрика / услуга"
        />
        <div className="flex gap-2">
          <Button type="submit">Фильтровать</Button>
          <Button asChild variant="outline">
            <Link href="/media">Сбросить</Link>
          </Button>
        </div>
      </form>

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
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Материалы пока не опубликованы.
        </div>
      )}
    </PageShell>
  )
}
