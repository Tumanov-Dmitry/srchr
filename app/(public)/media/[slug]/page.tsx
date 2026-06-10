import { notFound } from "next/navigation"
import Link from "next/link"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { ReputationStats } from "@/components/reputation/reputation-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageShell } from "@/components/layout/page-shell"
import {
  getFavoriteMarkers,
  getPublishedMaterialBySlug,
  getReputationSummary,
} from "@/lib/supabase/queries"
import type { Material } from "@/types"

type MaterialBlock = {
  type?: string
  title?: string
  content?: string | null
}

type MaterialContent = {
  blocks?: MaterialBlock[]
}

const typeLabels: Record<string, string> = {
  case: "Кейс",
  article: "Статья",
}

function getMaterialBlocks(material: Material) {
  if (!material.content) return null

  if (typeof material.content === "object") {
    const content = material.content as MaterialContent
    return Array.isArray(content.blocks) ? content.blocks : null
  }

  try {
    const parsed = JSON.parse(material.content) as MaterialContent
    return Array.isArray(parsed.blocks) ? parsed.blocks : null
  } catch {
    return [
      {
        type: "text",
        title: null,
        content: material.content,
      },
    ]
  }
}

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = await getPublishedMaterialBySlug(slug)

  if (!item) notFound()

  const blocks = getMaterialBlocks(item)
  const isExpertOwner = item.owner_type === "expert" && item.expert_id
  const reputationTargetType = isExpertOwner ? "expert" : "contractor"
  const reputationTargetId = isExpertOwner
    ? item.expert_id
    : item.organizations?.is_contractor
      ? (item.organization_id ?? item.company_id)
      : null
  const [favoriteMarkers, reputation] = await Promise.all([
    getFavoriteMarkers([{ targetType: item.type, targetId: item.id }]),
    reputationTargetId
      ? getReputationSummary(reputationTargetType, reputationTargetId)
      : Promise.resolve(null),
  ])
  const expertName = item.expert_profiles
    ? [item.expert_profiles.first_name, item.expert_profiles.last_name]
        .filter(Boolean)
        .join(" ")
    : null
  const authorName =
    expertName ?? item.organizations?.name ?? item.author ?? "SRCHR"
  const authorHref = item.expert_profiles?.slug
    ? `/@${item.expert_profiles.slug}`
    : item.organizations?.slug
      ? `/contractors/${item.organizations.slug}`
      : null

  return (
    <PageShell>
      <article className="mx-auto max-w-4xl">
        {item.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="mb-8 h-80 w-full rounded-lg object-cover"
            src={item.cover_url}
          />
        ) : null}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{typeLabels[item.type] ?? item.type}</Badge>
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
        <div className="mb-3 space-y-2">
          {authorHref ? (
            <Link
              className="text-sm font-medium text-primary"
              href={authorHref}
            >
              {authorName}
            </Link>
          ) : (
            <p className="text-sm font-medium text-primary">{authorName}</p>
          )}
          {reputationTargetId ? (
            <ReputationStats
              compact
              href={authorHref ? `${authorHref}#reputation` : undefined}
              summary={reputation}
            />
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
          {item.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          {item.description ?? "Краткое описание материала скоро появится."}
        </p>

        {blocks?.length ? (
          <div className="mt-8 space-y-6">
            {blocks.map((block, index) => (
              <section key={`${block.type ?? "block"}-${index}`}>
                {block.title ? (
                  <h2 className="text-xl font-semibold tracking-normal">
                    {block.title}
                  </h2>
                ) : null}
                <p className="mt-2 whitespace-pre-line leading-8">
                  {block.content}
                </p>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-8 text-muted-foreground">
            Полный текст материала будет добавлен позже.
          </div>
        )}

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Комментарии</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Комментарии будут подключены в следующих версиях.
          </CardContent>
        </Card>
      </article>
    </PageShell>
  )
}
