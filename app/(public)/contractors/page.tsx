import { ContractorCard } from "@/components/contractors/contractor-card"
import { ContractorFilters } from "@/components/contractors/contractor-filters"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import {
  getFavoriteMarkers,
  getPublishedContractors,
  getReputationSummaries,
  getServices,
} from "@/lib/supabase/queries"
import type { ContractorProfile, Organization, Service } from "@/types"

type ContractorListItem = Organization & {
  contractor_profiles?: ContractorProfile[]
}

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string
    service?: string
    budget?: string
    sort?: string
  }>
}) {
  const filters = await searchParams
  const [contractors, services] = await Promise.all([
    getPublishedContractors(filters),
    getServices(),
  ])
  const contractorItems = contractors as ContractorListItem[]
  const [favoriteMarkers, reputationSummaries] = await Promise.all([
    getFavoriteMarkers(
      contractorItems.map((contractor) => ({
        targetType: "company",
        targetId: contractor.id,
      })),
    ),
    getReputationSummaries(
      "contractor",
      contractorItems.map((contractor) => contractor.id),
    ),
  ])
  const sortedContractors = [...contractorItems].sort((left, right) => {
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

    return left.name.localeCompare(right.name, "ru")
  })

  return (
    <PageShell>
      <PageHeader
        title="Каталог подрядчиков"
        description="Опубликованные подрядчики SRCHR с фильтрами по городу, услуге и бюджету."
      />
      <ContractorFilters
        services={services as Service[]}
        defaultCity={filters.city}
        defaultService={filters.service}
        defaultBudget={filters.budget}
        defaultSort={filters.sort}
      />
      {contractors.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sortedContractors.map((contractor) => (
            <ContractorCard
              key={contractor.id}
              contractor={contractor}
              favoriteId={favoriteMarkers.get(`company:${contractor.id}`)}
              reputation={reputationSummaries.get(contractor.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Подрядчики по выбранным фильтрам не найдены.
        </div>
      )}
    </PageShell>
  )
}
