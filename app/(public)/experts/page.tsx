import Link from "next/link"
import { RotateCcw, Search, UsersRound } from "@/components/ui/icons"

import { CatalogAnalyticsTracker } from "@/components/analytics/catalog-analytics-tracker"
import { ExpertCard } from "@/components/experts/expert-card"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { EmptyState } from "@/components/srchr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPublicViewCounts } from "@/lib/supabase/analytics-queries"
import {
  getFavoriteMarkers,
  getPublishedExperts,
  getReputationSummaries,
  type ExpertFilters,
} from "@/lib/supabase/queries"

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
        description="Публичные профили специалистов, которые работают самостоятельно или связаны с компаниями."
        title="Эксперты"
      />

      <Card className="mb-8 shadow-none">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_180px_1fr_auto]">
            <Input
              defaultValue={filters.q ?? ""}
              name="q"
              placeholder="Имя, должность или компания"
            />
            <Input
              defaultValue={filters.specialization ?? ""}
              name="specialization"
              placeholder="Специализация"
            />
            <FormSelect
              defaultValue={filters.sort ?? "newest"}
              name="sort"
              options={[
                { value: "newest", label: "Сначала новые" },
                { value: "reputation", label: "По репутации" },
                { value: "reviews", label: "По отзывам" },
                { value: "recommendations", label: "По рекомендациям" },
              ]}
            />
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
              <Button type="submit">
                <Search />
                Найти
              </Button>
              <Button asChild size="icon" variant="outline">
                <Link aria-label="Сбросить фильтры" href="/experts">
                  <RotateCcw />
                </Link>
              </Button>
            </div>
            <Input
              defaultValue={filters.company ?? ""}
              name="company"
              placeholder="Компания"
            />
            <div className="flex min-h-11 items-center gap-3 rounded-lg border bg-card px-3.5 xl:col-span-2">
              <Checkbox
                defaultChecked={filters.open === "true"}
                id="open"
                name="open"
                value="true"
              />
              <Label htmlFor="open">Открыт к сотрудничеству</Label>
            </div>
          </form>
        </CardContent>
      </Card>

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
        <EmptyState
          description="Попробуйте изменить параметры поиска."
          icon={UsersRound}
          title="Эксперты не найдены"
        />
      )}
    </PageShell>
  )
}
