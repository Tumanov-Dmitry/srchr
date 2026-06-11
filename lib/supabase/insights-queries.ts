import { createAdminClient } from "@/lib/supabase/admin"

type ServiceRow = {
  id: string
  name: string
}

type CountRow = {
  name: string
  count: number
}

const baseMarketCategories = [
  "Employer Branding",
  "HR",
  "Event",
  "Research",
  "PR",
  "Creative",
  "Digital",
]

export type ServiceInsight = {
  id: string
  name: string
  contractors: number
  experts: number
  tenders: number
  cases: number
  averageBudget: number | null
  medianBudget: number | null
  averageDuration: number | null
  medianDuration: number | null
  demandScore: number
}

export type MarketInsights = {
  totals: {
    contractors: number
    experts: number
    tenders: number
    materials: number
    views: number
  }
  services: ServiceInsight[]
  categories: CountRow[]
  contractorSizes: CountRow[]
  expertSpecializations: CountRow[]
  materialTypes: CountRow[]
}

function list(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return typeof value === "string"
    ? value
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

function median(values: number[]) {
  if (values.length === 0) return null
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

function average(values: number[]) {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function countValues(values: string[]) {
  const counts = new Map<string, number>()

  for (const rawValue of values) {
    const value = rawValue.trim()
    if (!value) continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name, "ru"),
    )
}

function numericValue(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function publicTaxonomyValues(values: string[], services: ServiceRow[]) {
  const taxonomy = [
    ...services.map((service) => service.name),
    ...baseMarketCategories,
  ]
  const uniqueTaxonomy = [...new Set(taxonomy)]

  return values.flatMap((value) => {
    const normalized = value.toLocaleLowerCase("ru")
    const matched = uniqueTaxonomy.find((item) => {
      const taxonomyValue = item.toLocaleLowerCase("ru")
      return normalized === taxonomyValue || normalized.includes(taxonomyValue)
    })

    return matched ? [matched] : []
  })
}

export async function getMarketInsights(): Promise<MarketInsights> {
  const supabase = createAdminClient()
  const [
    servicesResult,
    organizationServicesResult,
    contractorsResult,
    contractorProfilesResult,
    expertsResult,
    materialsResult,
    tendersResult,
    tenderFactsResult,
    publicTotalsResult,
  ] = await Promise.all([
    supabase.from("services").select("id, name").order("name"),
    supabase.from("organization_services").select("*"),
    supabase
      .from("organizations")
      .select("id")
      .eq("is_contractor", true)
      .eq("status", "published"),
    supabase.from("contractor_profiles").select("*"),
    supabase
      .from("expert_profiles")
      .select("id, specializations")
      .eq("is_public", true)
      .eq("status", "published"),
    supabase
      .from("materials")
      .select("id, type, category")
      .eq("status", "published"),
    supabase.from("tenders").select("id").eq("status", "published"),
    supabase.from("analytics_tender_facts").select("*"),
    supabase.from("analytics_public_totals").select("views"),
  ])

  const services = (servicesResult.data ?? []) as ServiceRow[]
  const organizationServices = (organizationServicesResult.data ?? []) as Array<
    Record<string, unknown>
  >
  const contractorProfiles = (contractorProfilesResult.data ?? []) as Array<
    Record<string, unknown>
  >
  const experts = (expertsResult.data ?? []) as Array<Record<string, unknown>>
  const materials = (materialsResult.data ?? []) as Array<
    Record<string, unknown>
  >
  const tenderFacts = (tenderFactsResult.data ?? []) as Array<
    Record<string, unknown>
  >
  const publicTotals = (publicTotalsResult.data ?? []) as Array<
    Record<string, unknown>
  >

  const serviceInsights = services.map((service) => {
    const serviceName = service.name.toLocaleLowerCase("ru")
    const contractorIds = new Set(
      organizationServices
        .filter((row) => row.service_id === service.id)
        .map((row) => String(row.organization_id ?? row.org_id ?? ""))
        .filter(Boolean),
    )
    const expertCount = experts.filter((expert) =>
      list(expert.specializations).some((specialization) =>
        specialization.toLocaleLowerCase("ru").includes(serviceName),
      ),
    ).length
    const serviceMaterials = materials.filter((material) =>
      String(material.category ?? "")
        .toLocaleLowerCase("ru")
        .includes(serviceName),
    )
    const serviceTenderFacts = tenderFacts.filter((fact) =>
      String(fact.service_category ?? "")
        .toLocaleLowerCase("ru")
        .includes(serviceName),
    )
    const budgets = serviceTenderFacts
      .map(
        (fact) =>
          numericValue(fact.budget_value) ??
          numericValue(fact.budget_to) ??
          numericValue(fact.budget_from),
      )
      .filter((value): value is number => value !== null)
    const durations = serviceTenderFacts
      .map((fact) => numericValue(fact.duration_days))
      .filter((value): value is number => value !== null)

    return {
      id: service.id,
      name: service.name,
      contractors: contractorIds.size,
      experts: expertCount,
      tenders: serviceTenderFacts.length,
      cases: serviceMaterials.filter((material) => material.type === "case")
        .length,
      averageBudget: average(budgets),
      medianBudget: median(budgets),
      averageDuration: average(durations),
      medianDuration: median(durations),
      demandScore: serviceTenderFacts.length + serviceMaterials.length,
    }
  })

  const categories = countValues(
    publicTaxonomyValues(
      [
        ...materials.map((material) => String(material.category ?? "")),
        ...experts.flatMap((expert) => list(expert.specializations)),
      ],
      services,
    ),
  ).slice(0, 20)
  const contractorSizes = countValues(
    contractorProfiles.map((profile) => {
      const size = numericValue(profile.team_size)
      if (!size) return "Размер не указан"
      if (size < 10) return "До 10 человек"
      if (size <= 50) return "10-50 человек"
      return "Более 50 человек"
    }),
  )
  const expertSpecializations = countValues(
    publicTaxonomyValues(
      experts.flatMap((expert) => list(expert.specializations)),
      services,
    ),
  ).slice(0, 20)
  const materialTypes = countValues(
    materials.map((material) =>
      material.type === "case" ? "Кейсы" : "Статьи",
    ),
  )

  return {
    totals: {
      contractors: contractorsResult.data?.length ?? 0,
      experts: experts.length,
      tenders: tendersResult.data?.length ?? 0,
      materials: materials.length,
      views: publicTotals.reduce((sum, row) => sum + Number(row.views ?? 0), 0),
    },
    services: serviceInsights.sort(
      (left, right) =>
        right.demandScore - left.demandScore ||
        right.contractors - left.contractors,
    ),
    categories,
    contractorSizes,
    expertSpecializations,
    materialTypes,
  }
}
