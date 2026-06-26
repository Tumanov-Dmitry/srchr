import Link from "next/link"

import { CatalogAnalyticsTracker } from "@/components/analytics/catalog-analytics-tracker"
import { ContractorCard } from "@/components/contractors/contractor-card"
import { ExpertCard } from "@/components/experts/expert-card"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { MaterialCard } from "@/components/media/material-card"
import { GlobalSearchForm } from "@/components/search/global-search-form"
import { EmptyState } from "@/components/srchr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "@/components/ui/icons"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPublicViewCounts } from "@/lib/supabase/analytics-queries"
import {
  getActiveSubscriptionMarkers,
  getFavoriteMarkers,
  getGlobalSearchResults,
  getReputationSummaries,
} from "@/lib/supabase/queries"
import type { ExpertProfile, Organization } from "@/types"

type SearchParams = {
  q?: string | string[]
  sort?: string | string[]
  pro?: string | string[]
  profiles?: string | string[]
  materials?: string | string[]
}

function param(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) return value.at(-1) ?? fallback
  return value ?? fallback
}

function normalizeSort(value: string) {
  return ["rating", "relevance", "newest", "name"].includes(value)
    ? value
    : "rating"
}

function normalizeProfileTab(value: string) {
  return value === "experts" ? "experts" : "contractors"
}

function normalizeMaterialTab(value: string) {
  return value === "article" ? "article" : "case"
}

function searchScore(values: Array<string | null | undefined>, query: string) {
  const normalized = query.trim().toLocaleLowerCase("ru-RU")
  if (!normalized) return 0

  return values.reduce((score, value, index) => {
    const text = value?.toLocaleLowerCase("ru-RU") ?? ""
    if (!text.includes(normalized)) return score
    return score + Math.max(10, 80 - index * 12)
  }, 0)
}

function searchHref(
  params: {
    q: string
    sort: string
    pro: string
    profiles: string
    materials: string
  },
  next: Partial<typeof params>,
) {
  const url = new URLSearchParams()
  const merged = { ...params, ...next }

  for (const [key, value] of Object.entries(merged)) {
    if (value) url.set(key, value)
  }

  return `/search?${url.toString()}`
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const rawParams = await searchParams
  const q = param(rawParams.q).trim()
  const sort = normalizeSort(param(rawParams.sort, "rating"))
  const pro = param(rawParams.pro, "first") === "off" ? "off" : "first"
  const profileTab = normalizeProfileTab(param(rawParams.profiles))
  const materialTab = normalizeMaterialTab(param(rawParams.materials))
  const proFirst = pro !== "off"

  const results = await getGlobalSearchResults(q)
  const [contractorReputation, expertReputation, proMarkers, materialViews] =
    await Promise.all([
      getReputationSummaries(
        "contractor",
        results.contractors.map((contractor) => contractor.id),
      ),
      getReputationSummaries(
        "expert",
        results.experts.map((expert) => expert.id),
      ),
      getActiveSubscriptionMarkers({
        organizationIds: results.contractors.map((contractor) => contractor.id),
        userIds: results.experts.map((expert) => expert.user_id),
      }),
      getPublicViewCounts(
        "material",
        results.materials.map((material) => material.id),
      ),
    ])
  const [favoriteMarkers, contractorViews, expertViews] = await Promise.all([
    getFavoriteMarkers([
      ...results.contractors.map((contractor) => ({
        targetType: "company" as const,
        targetId: contractor.id,
      })),
      ...results.experts.map((expert) => ({
        targetType: "expert" as const,
        targetId: expert.id,
      })),
      ...results.materials.map((material) => ({
        targetType: material.type,
        targetId: material.id,
      })),
    ]),
    getPublicViewCounts(
      "contractor",
      results.contractors.map((contractor) => contractor.id),
    ),
    getPublicViewCounts(
      "expert",
      results.experts.map((expert) => expert.id),
    ),
  ])

  const sortedContractors = [...results.contractors].sort((left, right) => {
    const leftPro = proMarkers.companyIds.has(left.id) ? 1 : 0
    const rightPro = proMarkers.companyIds.has(right.id) ? 1 : 0
    if (proFirst && leftPro !== rightPro) return rightPro - leftPro

    if (sort === "name") return left.name.localeCompare(right.name, "ru")
    if (sort === "newest") {
      return (
        Date.parse(right.created_at ?? "") - Date.parse(left.created_at ?? "")
      )
    }
    if (sort === "relevance") {
      return (
        searchScore(
          [
            right.name,
            right.description,
            right.city,
            right.contractor_profiles?.[0]?.short_description,
          ],
          q,
        ) -
        searchScore(
          [
            left.name,
            left.description,
            left.city,
            left.contractor_profiles?.[0]?.short_description,
          ],
          q,
        )
      )
    }

    return (
      (contractorReputation.get(right.id)?.total_points ?? 0) -
      (contractorReputation.get(left.id)?.total_points ?? 0)
    )
  })

  const sortedExperts = [...results.experts].sort((left, right) => {
    const leftPro = proMarkers.expertUserIds.has(left.user_id) ? 1 : 0
    const rightPro = proMarkers.expertUserIds.has(right.user_id) ? 1 : 0
    if (proFirst && leftPro !== rightPro) return rightPro - leftPro

    const leftName = [left.first_name, left.last_name].filter(Boolean).join(" ")
    const rightName = [right.first_name, right.last_name]
      .filter(Boolean)
      .join(" ")

    if (sort === "name") return leftName.localeCompare(rightName, "ru")
    if (sort === "newest") {
      return (
        Date.parse(right.created_at ?? "") - Date.parse(left.created_at ?? "")
      )
    }
    if (sort === "relevance") {
      return (
        searchScore(
          [
            rightName,
            right.position,
            right.specializations,
            right.skills,
            right.short_description,
          ],
          q,
        ) -
        searchScore(
          [
            leftName,
            left.position,
            left.specializations,
            left.skills,
            left.short_description,
          ],
          q,
        )
      )
    }

    return (
      (expertReputation.get(right.id)?.total_points ?? 0) -
      (expertReputation.get(left.id)?.total_points ?? 0)
    )
  })

  const sortedMaterials = [...results.materials].sort((left, right) => {
    if (sort === "newest") {
      return (
        Date.parse(right.published_at ?? right.created_at ?? "") -
        Date.parse(left.published_at ?? left.created_at ?? "")
      )
    }
    if (sort === "name") return left.title.localeCompare(right.title, "ru")
    if (sort === "relevance") {
      return (
        searchScore([right.title, right.description, right.category], q) -
        searchScore([left.title, left.description, left.category], q)
      )
    }

    return (materialViews.get(right.id) ?? 0) - (materialViews.get(left.id) ?? 0)
  })

  const activeProfiles =
    profileTab === "experts" ? sortedExperts : sortedContractors
  const activeMaterials = sortedMaterials.filter(
    (material) => material.type === materialTab,
  )
  const baseParams = {
    q,
    sort,
    pro,
    profiles: profileTab,
    materials: materialTab,
  }

  return (
    <PageShell>
      <CatalogAnalyticsTracker
        catalog="search"
        filters={{ q, sort, pro, profiles: profileTab, materials: materialTab }}
      />
      <PageHeader
        title="Поиск"
        description="Единая выдача по агентствам, экспертам, кейсам и статьям. По умолчанию выше показываются pro-профили и результаты с большей репутацией."
      />

      <GlobalSearchForm
        defaultPro={pro}
        defaultQuery={q}
        defaultSort={sort}
      />

      <section className="mt-8 space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="type-h2">Агентства и эксперты</h2>
            <p className="type-small mt-1 text-muted-foreground">
              Штатная сортировка: pro first, затем репутация.
            </p>
          </div>
          {proFirst ? <Badge>Сначала pro</Badge> : null}
        </div>

        <Tabs value={profileTab}>
          <TabsList>
            <TabsTrigger asChild value="contractors">
              <Link
                href={searchHref(baseParams, { profiles: "contractors" })}
              >
                Агентства · {sortedContractors.length}
              </Link>
            </TabsTrigger>
            <TabsTrigger asChild value="experts">
              <Link href={searchHref(baseParams, { profiles: "experts" })}>
                Эксперты · {sortedExperts.length}
              </Link>
            </TabsTrigger>
          </TabsList>
          <TabsContent value={profileTab}>
            {activeProfiles.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {profileTab === "experts"
                  ? (activeProfiles as ExpertProfile[]).map((expert) => (
                      <ExpertCard
                        expert={expert}
                        favoriteId={favoriteMarkers.get(`expert:${expert.id}`)}
                        key={expert.id}
                        reputation={expertReputation.get(expert.id)}
                        views={expertViews.get(expert.id)}
                      />
                    ))
                  : (activeProfiles as Organization[]).map((contractor) => (
                      <ContractorCard
                        contractor={contractor}
                        favoriteId={favoriteMarkers.get(
                          `company:${contractor.id}`,
                        )}
                        key={contractor.id}
                        reputation={contractorReputation.get(contractor.id)}
                        views={contractorViews.get(contractor.id)}
                      />
                    ))}
              </div>
            ) : (
              <EmptyState
                description="Попробуйте изменить запрос или открыть полный каталог."
                icon={Search}
                title="Профили не найдены"
              />
            )}
          </TabsContent>
        </Tabs>
      </section>

      <section className="mt-10 space-y-4">
        <div>
          <h2 className="type-h2">Кейсы и статьи</h2>
          <p className="type-small mt-1 text-muted-foreground">
            В MVP рейтинг материалов считается по публичному интересу:
            просмотрам и свежести.
          </p>
        </div>

        <Tabs value={materialTab}>
          <TabsList>
            <TabsTrigger asChild value="case">
              <Link href={searchHref(baseParams, { materials: "case" })}>
                Кейсы ·{" "}
                {sortedMaterials.filter((material) => material.type === "case")
                  .length}
              </Link>
            </TabsTrigger>
            <TabsTrigger asChild value="article">
              <Link href={searchHref(baseParams, { materials: "article" })}>
                Статьи ·{" "}
                {
                  sortedMaterials.filter(
                    (material) => material.type === "article",
                  ).length
                }
              </Link>
            </TabsTrigger>
          </TabsList>
          <TabsContent value={materialTab}>
            {activeMaterials.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {activeMaterials.map((material) => (
                  <MaterialCard
                    favoriteId={favoriteMarkers.get(
                      `${material.type}:${material.id}`,
                    )}
                    item={material}
                    key={material.id}
                    views={materialViews.get(material.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Материалы не найдены</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>Можно посмотреть полный раздел:</span>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/media">Медиа</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </PageShell>
  )
}
