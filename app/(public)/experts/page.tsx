import Link from "next/link"
import { CatalogAnalyticsTracker } from "@/components/analytics/catalog-analytics-tracker"
import { ExpertCard } from "@/components/experts/expert-card"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getFavoriteMarkers,
  getPublishedExperts,
  getReputationSummaries,
  type ExpertFilters,
} from "@/lib/supabase/queries"
import { getPublicViewCounts } from "@/lib/supabase/analytics-queries"

export default async function ExpertsPage({
  searchParams,
}: {
  searchParams: Promise<ExpertFilters>
}) {
  const filters = await searchParams
  const experts = await getPublishedExperts(filters)
  const [favoriteMarkers, reputationSummaries, viewCounts] = await Promise.all([
    getFavoriteMarkers(
      experts.map((expert) => ({ targetType: "expert", targetId: expert.id })),
    ),
    getReputationSummaries(
      "expert",
      experts.map((expert) => expert.id),
    ),
    getPublicViewCounts(
      "expert",
      experts.map((expert) => expert.id),
    ),
  ])
  const sortedExperts = [...experts].sort((left, right) => {
    const leftSummary = reputationSummaries.get(left.id)
    const rightSummary = reputationSummaries.get(right.id)

    if (filters.sort === "reputation") {
      return (
        (rightSummary?.total_points ?? 0) - (leftSummary?.total_points ?? 0)
      )
    }
    if (filters.sort === "reviews") {
      return (
        (rightSummary?.reviews_count ?? 0) - (leftSummary?.reviews_count ?? 0)
      )
    }
    if (filters.sort === "recommendations") {
      return (
        (rightSummary?.recommendations_count ?? 0) -
        (leftSummary?.recommendations_count ?? 0)
      )
    }

    return 0
  })

  return (
    <PageShell>
      <CatalogAnalyticsTracker catalog="experts" filters={filters} />
      <PageHeader
        title="Эксперты"
        description="Публичные профили специалистов, которые могут работать самостоятельно или быть связаны с компаниями."
      />

      <form className="mb-8 grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-[1fr_180px_180px_180px_200px_auto]">
        <Input defaultValue={filters.q ?? ""} name="q" placeholder="Поиск" />
        <Input
          defaultValue={filters.specialization ?? ""}
          name="specialization"
          placeholder="Специализация"
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          defaultValue={filters.sort ?? "newest"}
          name="sort"
        >
          <option value="newest">Сначала новые</option>
          <option value="reputation">По репутации</option>
          <option value="reviews">По отзывам</option>
          <option value="recommendations">По рекомендациям</option>
        </select>
        <Input
          defaultValue={filters.city ?? ""}
          name="city"
          placeholder="Город"
        />
        <Input
          defaultValue={filters.skills ?? ""}
          name="skills"
          placeholder="Навыки"
        />
        <div className="flex gap-2">
          <Button type="submit">Искать</Button>
          <Button asChild variant="outline">
            <Link href="/experts">Сбросить</Link>
          </Button>
        </div>
        <Input
          defaultValue={filters.company ?? ""}
          name="company"
          placeholder="Компания"
        />
        <label className="flex items-center gap-2 rounded-md border px-3 text-sm md:col-span-2">
          <input
            defaultChecked={filters.open === "true"}
            name="open"
            type="checkbox"
            value="true"
          />
          Открыт к сотрудничеству
        </label>
      </form>

      {experts.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sortedExperts.map((expert) => (
            <ExpertCard
              expert={expert}
              favoriteId={favoriteMarkers.get(`expert:${expert.id}`)}
              key={expert.id}
              reputation={reputationSummaries.get(expert.id)}
              views={viewCounts.get(expert.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Эксперты пока не опубликованы.
        </div>
      )}
    </PageShell>
  )
}
