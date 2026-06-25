import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  Lock,
  Mail,
  MapPin,
  Phone,
  Send,
  Users,
} from "@/components/ui/icons"
import { AnalyticsLink } from "@/components/analytics/analytics-link"
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker"
import { PublicViewCount } from "@/components/analytics/public-view-count"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { ReputationStats } from "@/components/reputation/reputation-stats"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/layout/page-shell"
import {
  getContractorBySlug,
  getCurrentUser,
  getFavoriteMarkers,
  getReputationDetails,
} from "@/lib/supabase/queries"
import { getPublicViewCount } from "@/lib/supabase/analytics-queries"
import { formatMoney } from "@/lib/utils"
import type { ContractorProfile, Material, Organization } from "@/types"

type ContractorPageData = Organization & {
  contractor_profiles?: ContractorProfile[]
  materials?: Material[]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const contractor = (await getContractorBySlug(
    slug,
  )) as ContractorPageData | null

  if (!contractor) {
    return {
      title: "Подрядчик не найден · SRCHR",
    }
  }

  const profile = contractor.contractor_profiles?.[0]
  const description =
    profile?.short_description ??
    contractor.description ??
    "Публичный профиль подрядчика на SRCHR"

  return {
    title: `${contractor.name} · SRCHR`,
    description,
  }
}

export default async function ContractorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [contractor, user] = await Promise.all([
    getContractorBySlug(slug),
    getCurrentUser(),
  ])

  if (!contractor) notFound()

  const item = contractor as ContractorPageData
  const profile = item.contractor_profiles?.[0] ?? null
  const website = item.website_url ?? item.website
  const minBudget = profile?.min_budget ?? item.min_budget
  const shortDescription =
    profile?.short_description ??
    item.description ??
    "Подрядчик пока не добавил краткое описание."
  const fullDescription =
    profile?.full_description ??
    item.description ??
    "Подробное описание подрядчика пока не заполнено."
  const [favoriteMarkers, reputation, views] = await Promise.all([
    getFavoriteMarkers([{ targetType: "company", targetId: item.id }]),
    getReputationDetails("contractor", item.id),
    getPublicViewCount("contractor", item.id),
  ])
  const services =
    item.organization_services
      ?.map((service) => service.services?.name)
      .filter((name): name is string => Boolean(name)) ?? []

  return (
    <PageShell>
      <AnalyticsTracker
        eventType="contractor_view"
        source="contractor_profile"
        targetId={item.id}
        targetType="contractor"
      />
      <div className="mb-6">
        <Button asChild variant="ghost">
          <Link href="/contractors">
            <ArrowLeft className="h-4 w-4" />
            Все подрядчики
          </Link>
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-secondary">
                {item.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.logo_url}
                    alt=""
                    className="h-16 w-16 rounded-md object-cover"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Публичный профиль</Badge>
                  {item.status ? <Badge>{item.status}</Badge> : null}
                  <FavoriteButton
                    initialFavoriteId={favoriteMarkers.get(
                      `company:${item.id}`,
                    )}
                    label="Добавить в избранное"
                    targetId={item.id}
                    targetType="company"
                  />
                </div>
                <h1 className="type-h1">
                  {item.name}
                </h1>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {item.city ?? "Город не указан"}
                  </span>
                  <span className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4" />
                    {services.length > 0
                      ? `${services.length} услуг`
                      : "Услуги не указаны"}
                  </span>
                  <PublicViewCount views={views} />
                </div>
                <p className="type-body mt-5 max-w-3xl text-muted-foreground">
                  {shortDescription}
                </p>
                <div id="reputation">
                  <ReputationStats
                    breakdown={reputation.breakdown}
                    className="mt-5"
                    details
                    summary={reputation.summary}
                  />
                </div>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-normal">Услуги</h2>
            {services.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                  <Badge key={service} variant="secondary">
                    {service}
                  </Badge>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Подрядчик пока не выбрал услуги.
                </CardContent>
              </Card>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-normal">
              О подрядчике
            </h2>
            <Card>
              <CardContent className="p-6">
                <p className="whitespace-pre-line leading-8 text-muted-foreground">
                  {fullDescription}
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-normal">Медиа</h2>
            {(item.materials ?? []).length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {(item.materials ?? []).map((material) => (
                  <Card key={material.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {material.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {material.description ??
                          "Описание кейса скоро появится."}
                      </p>
                      <Button asChild variant="outline" className="mt-4">
                        <Link href={`/media/${material.slug}`}>
                          Открыть материал
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Материалы этого подрядчика пока не опубликованы.
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Параметры</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground">Минимальный бюджет</div>
                <div className="font-medium">{formatMoney(minBudget)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Команда</div>
                <div className="flex items-center gap-2 font-medium">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {profile?.team_size
                    ? `${profile.team_size} чел.`
                    : "Не указана"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Цены</div>
                <p className="mt-1 leading-6">
                  {profile?.price_description ?? "Описание цен не заполнено."}
                </p>
              </div>
              {website ? (
                <Button asChild variant="outline" className="w-full">
                  <AnalyticsLink
                    eventType="profile_website_click"
                    href={website}
                    rel="noreferrer"
                    source="contractor_website"
                    target="_blank"
                    targetId={item.id}
                    targetType="contractor"
                  >
                    Сайт
                    <ExternalLink className="h-4 w-4" />
                  </AnalyticsLink>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Контакты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <div className="space-y-3">
                  {(profile?.contact_email ?? item.email) ? (
                    <AnalyticsLink
                      className="flex items-center gap-2 text-sm"
                      eventType="contact_click"
                      href={`mailto:${profile?.contact_email ?? item.email}`}
                      source="contractor_email"
                      targetId={item.id}
                      targetType="contractor"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {profile?.contact_email ?? item.email}
                    </AnalyticsLink>
                  ) : null}
                  {(profile?.contact_phone ?? item.phone) ? (
                    <AnalyticsLink
                      className="flex items-center gap-2 text-sm"
                      eventType="contact_click"
                      href={`tel:${profile?.contact_phone ?? item.phone}`}
                      source="contractor_phone"
                      targetId={item.id}
                      targetType="contractor"
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {profile?.contact_phone ?? item.phone}
                    </AnalyticsLink>
                  ) : null}
                  {profile?.telegram_url ? (
                    <AnalyticsLink
                      className="flex items-center gap-2 text-sm"
                      eventType="profile_telegram_click"
                      href={profile.telegram_url}
                      rel="noreferrer"
                      source="contractor_telegram"
                      target="_blank"
                      targetId={item.id}
                      targetType="contractor"
                    >
                      <Send className="h-4 w-4 text-muted-foreground" />
                      Telegram
                    </AnalyticsLink>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Контакты скрыты. Публичная ссылка доступна в интернете, но
                      контактные данные видны только авторизованным
                      пользователям.
                    </span>
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/login">Войти, чтобы увидеть контакты</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Публичная ссылка</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <code className="break-all rounded bg-secondary px-2 py-1 text-foreground">
                /contractors/{item.slug}
              </code>
            </CardContent>
          </Card>
        </aside>
      </section>
    </PageShell>
  )
}
