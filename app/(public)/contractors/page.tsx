import { ContractorCard } from "@/components/contractors/contractor-card"
import { ContractorFilters } from "@/components/contractors/contractor-filters"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import {
  getFavoriteMarkers,
  getPublishedContractors,
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
  }>
}) {
  const filters = await searchParams
  const [contractors, services] = await Promise.all([
    getPublishedContractors(filters),
    getServices(),
  ])
  const favoriteMarkers = await getFavoriteMarkers(
    (contractors as ContractorListItem[]).map((contractor) => ({
      targetType: "company",
      targetId: contractor.id,
    })),
  )

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
      />
      {contractors.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(contractors as ContractorListItem[]).map((contractor) => (
            <ContractorCard
              key={contractor.id}
              contractor={contractor}
              favoriteId={favoriteMarkers.get(`company:${contractor.id}`)}
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
