import Link from "next/link"
import { ExpertCard } from "@/components/experts/expert-card"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getFavoriteMarkers,
  getPublishedExperts,
  type ExpertFilters,
} from "@/lib/supabase/queries"

export default async function ExpertsPage({
  searchParams,
}: {
  searchParams: Promise<ExpertFilters>
}) {
  const filters = await searchParams
  const experts = await getPublishedExperts(filters)
  const favoriteMarkers = await getFavoriteMarkers(
    experts.map((expert) => ({ targetType: "expert", targetId: expert.id })),
  )

  return (
    <PageShell>
      <PageHeader
        title="Эксперты"
        description="Публичные профили специалистов, которые могут работать самостоятельно или быть связаны с компаниями."
      />

      <form className="mb-8 grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-[1fr_180px_180px_180px_auto]">
        <Input defaultValue={filters.q ?? ""} name="q" placeholder="Поиск" />
        <Input
          defaultValue={filters.specialization ?? ""}
          name="specialization"
          placeholder="Специализация"
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
          {experts.map((expert) => (
            <ExpertCard
              expert={expert}
              favoriteId={favoriteMarkers.get(`expert:${expert.id}`)}
              key={expert.id}
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
