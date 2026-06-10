import { notFound } from "next/navigation"
import { ExternalLink, Mail, MapPin, Send } from "lucide-react"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { ReputationStats } from "@/components/reputation/reputation-stats"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/layout/page-shell"
import {
  getFavoriteMarkers,
  getPublishedExpertBySlug,
  getReputationDetails,
} from "@/lib/supabase/queries"

export default async function ExpertPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const expert = await getPublishedExpertBySlug(slug)

  if (!expert) notFound()

  const [favoriteMarkers, reputation] = await Promise.all([
    getFavoriteMarkers([{ targetType: "expert", targetId: expert.id }]),
    getReputationDetails("expert", expert.id),
  ])
  const name = [expert.first_name, expert.last_name].filter(Boolean).join(" ")
  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://srchr.ru"}/@${expert.slug}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}`

  return (
    <PageShell>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                {expert.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={expert.avatar_url}
                  />
                ) : (
                  <span className="text-3xl font-semibold">
                    {expert.first_name.slice(0, 1)}
                  </span>
                )}
              </div>
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge>Эксперт</Badge>
                  {expert.is_open_to_work ? (
                    <Badge variant="outline">Открыт к сотрудничеству</Badge>
                  ) : null}
                  <FavoriteButton
                    initialFavoriteId={favoriteMarkers.get(
                      `expert:${expert.id}`,
                    )}
                    label="Добавить в избранное"
                    targetId={expert.id}
                    targetType="expert"
                  />
                </div>
                <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                  {name}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  {expert.position ?? "Специалист"}
                </p>
                {expert.city ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {expert.city}
                  </p>
                ) : null}
                <div id="reputation">
                  <ReputationStats
                    breakdown={reputation.breakdown}
                    className="mt-4"
                    details
                    summary={reputation.summary}
                  />
                </div>
              </div>
            </div>
            <p className="mt-6 whitespace-pre-line leading-8 text-muted-foreground">
              {expert.short_description ?? "Описание эксперта скоро появится."}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Экспертиза</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Info title="Специализации" value={expert.specializations} />
              <Info title="Навыки" value={expert.skills} />
              <Info title="Направления" value={expert.activity_areas} />
              <Info title="Опыт" value={expert.experience_description} />
              {expert.experience_years ? (
                <Info title="Стаж" value={`${expert.experience_years} лет`} />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Компании</CardTitle>
            </CardHeader>
            <CardContent>
              {expert.organizations?.length ? (
                <div className="flex flex-wrap gap-2">
                  {expert.organizations.map((organization) => (
                    <Badge key={organization.id} variant="outline">
                      {organization.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Связанные компании пока не указаны.
                </p>
              )}
            </CardContent>
          </Card>
        </article>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QR-визитка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="h-44 w-44 rounded-md border" src={qrUrl} />
              <code className="block break-all rounded bg-secondary px-2 py-1 text-sm">
                /@{expert.slug}
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Контакты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {expert.contact_email ? (
                <a
                  className="flex items-center gap-2"
                  href={`mailto:${expert.contact_email}`}
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {expert.contact_email}
                </a>
              ) : null}
              {expert.telegram_url ? (
                <a
                  className="flex items-center gap-2"
                  href={expert.telegram_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Send className="h-4 w-4 text-muted-foreground" />
                  Telegram
                </a>
              ) : null}
              {expert.website_url ? (
                <Button asChild className="w-full" variant="outline">
                  <a href={expert.website_url} rel="noreferrer" target="_blank">
                    Сайт
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageShell>
  )
}

function Info({ title, value }: { title: string; value?: string | null }) {
  if (!value) return null

  return (
    <div>
      <div className="font-medium">{title}</div>
      <p className="mt-1 whitespace-pre-line text-muted-foreground">{value}</p>
    </div>
  )
}
