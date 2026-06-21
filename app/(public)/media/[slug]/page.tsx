import { notFound } from "next/navigation"

import { AnalyticsInternalLink } from "@/components/analytics/analytics-internal-link"
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker"
import { PublicViewCount } from "@/components/analytics/public-view-count"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { PageShell } from "@/components/layout/page-shell"
import { MaterialContentRenderer } from "@/components/media/material-content-renderer"
import { ReputationStats } from "@/components/reputation/reputation-stats"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { parseMaterialDocument } from "@/lib/material-content"
import { getPublicViewCount } from "@/lib/supabase/analytics-queries"
import {
  getFavoriteMarkers,
  getPublishedMaterialBySlug,
  getReputationSummary,
} from "@/lib/supabase/queries"
import { formatDate } from "@/lib/utils"

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = await getPublishedMaterialBySlug(slug)
  if (!item) notFound()

  const document = parseMaterialDocument(item)
  const isExpertOwner = item.owner_type === "expert" && item.expert_id
  const reputationTargetType = isExpertOwner ? "expert" : "contractor"
  const reputationTargetId = isExpertOwner
    ? item.expert_id
    : item.organizations?.is_contractor
      ? (item.organization_id ?? item.company_id)
      : null
  const [favoriteMarkers, reputation, views] = await Promise.all([
    getFavoriteMarkers([{ targetType: item.type, targetId: item.id }]),
    reputationTargetId
      ? getReputationSummary(reputationTargetType, reputationTargetId)
      : Promise.resolve(null),
    getPublicViewCount("material", item.id),
  ])
  const expertName = item.expert_profiles
    ? [item.expert_profiles.first_name, item.expert_profiles.last_name]
        .filter(Boolean)
        .join(" ")
    : null
  const authorName =
    expertName ?? item.organizations?.name ?? item.author ?? "SRCHR"
  const authorHref = item.expert_profiles?.slug
    ? `/experts/${item.expert_profiles.slug}`
    : item.organizations?.slug
      ? `/contractors/${item.organizations.slug}`
      : null
  const tags = (item.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
  const audienceQuestion =
    typeof document.meta?.audience_question === "string"
      ? document.meta.audience_question
      : null

  return (
    <PageShell>
      <AnalyticsTracker
        eventType="material_view"
        source="material_page"
        targetId={item.id}
        targetType="material"
      />
      <article className="mx-auto max-w-4xl">
        {item.cover_url ? (
          <div className="mb-8 aspect-[16/7] overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="h-full w-full object-cover"
              src={item.cover_url}
            />
          </div>
        ) : null}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{item.type === "case" ? "Кейс" : "Статья"}</Badge>
            {item.category ? (
              <Badge variant="outline">{item.category}</Badge>
            ) : null}
          </div>
          <FavoriteButton
            initialFavoriteId={favoriteMarkers.get(`${item.type}:${item.id}`)}
            label="Добавить в избранное"
            targetId={item.id}
            targetType={item.type}
          />
        </div>
        <div className="space-y-2">
          {authorHref ? (
            <AnalyticsInternalLink
              className="text-sm font-medium text-primary"
              eventType={
                isExpertOwner
                  ? "material_author_click"
                  : "material_organization_click"
              }
              href={authorHref}
              source="material_author"
              targetId={item.id}
              targetType="material"
            >
              {authorName}
            </AnalyticsInternalLink>
          ) : (
            <p className="text-sm font-medium text-primary">{authorName}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formatDate(item.published_at ?? item.created_at)}
          </p>
          {reputationTargetId ? (
            <ReputationStats
              compact
              href={authorHref ? `${authorHref}#reputation` : undefined}
              summary={reputation}
            />
          ) : null}
        </div>
        <h1 className="mt-5 text-3xl font-semibold sm:text-5xl">
          {item.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          {item.description ?? "Описание материала скоро появится."}
        </p>
        <PublicViewCount className="mt-4" views={views} />
        {tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-10">
          <MaterialContentRenderer document={document} />
        </div>
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Комментарии</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {audienceQuestion ? (
              <p className="mb-4 text-base font-medium text-foreground">
                {audienceQuestion}
              </p>
            ) : null}
            Обсуждение скоро появится.
          </CardContent>
        </Card>
      </article>
    </PageShell>
  )
}
