import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createTenderResponse } from "@/app/actions/tenders"
import { AnalyticsTracker } from "@/components/analytics/analytics-tracker"
import { PublicViewCount } from "@/components/analytics/public-view-count"
import { PageShell } from "@/components/layout/page-shell"
import { ResponseForm } from "@/components/tenders/response-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getCurrentExpertProfile,
  getCurrentUser,
  getTenderBySlug,
  getUserOrganizationMemberships,
} from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/server"
import { getPublicViewCount } from "@/lib/supabase/analytics-queries"
import { formatDate, formatMoney } from "@/lib/utils"
import type { Tender } from "@/types"

function formatTenderBudget(tender: Tender) {
  if (tender.budget_from && tender.budget_to) {
    return `${formatMoney(tender.budget_from)} - ${formatMoney(tender.budget_to)}`
  }

  if (tender.budget_from) return `от ${formatMoney(tender.budget_from)}`
  if (tender.budget_to) return `до ${formatMoney(tender.budget_to)}`

  return formatMoney(tender.budget)
}

type ResponseOption = {
  value: string
  label: string
  description: string
}

export default async function TenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const [{ slug }, { message }, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ])

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/tenders/${slug}`)}`)
  }

  const [tender, expertState] = await Promise.all([
    getTenderBySlug(slug),
    getCurrentExpertProfile(),
  ])

  if (!tender) notFound()

  const item = tender as Tender
  const views = await getPublicViewCount("tender", item.id)
  const memberships = user ? await getUserOrganizationMemberships(user.id) : []
  const isOwner = memberships.some(
    (membership) => membership.organizations?.id === item.organization_id,
  )
  const contractorOrganizations = memberships
    .map((membership) => membership.organizations)
    .filter(
      (organization) =>
        Boolean(organization?.id) && Boolean(organization?.is_contractor),
    )
  const hasExpert = Boolean(expertState.profile)
  const responseOptions: ResponseOption[] = []

  for (const organization of contractorOrganizations) {
    if (!organization) continue
    responseOptions.push({
      value: `contractor:${organization.id}`,
      label: "Как подрядчик",
      description: organization.name,
    })
  }

  if (hasExpert) {
    responseOptions.push({
      value: `expert:${expertState.profile?.id}`,
      label: "Как эксперт",
      description: [
        expertState.profile?.first_name,
        expertState.profile?.last_name,
      ]
        .filter(Boolean)
        .join(" "),
    })
  }

  let hasResponse = false
  if (user && responseOptions.length > 0) {
    const supabase = await createClient()
    let query = supabase
      .from("tender_responses")
      .select("id")
      .eq("tender_id", item.id)

    const responseFilters = [`user_id.eq.${user.id}`]
    contractorOrganizations.forEach((organization) => {
      if (organization?.id) {
        responseFilters.push(`organization_id.eq.${organization.id}`)
      }
    })
    query = query.or(responseFilters.join(","))

    const { data } = await query.limit(1).maybeSingle()
    hasResponse = Boolean(data)
  }

  return (
    <PageShell>
      <AnalyticsTracker
        eventType="tender_view"
        source="tender_page"
        targetId={item.id}
        targetType="tender"
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <article>
          <p className="mb-3 text-sm font-medium text-primary">
            {item.organizations?.name ?? "Компания"}
          </p>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            {item.title}
          </h1>
          <PublicViewCount className="mt-4" views={views} />
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="mb-3 text-xl font-semibold tracking-normal">
                Описание
              </h2>
              <p className="whitespace-pre-line leading-8 text-muted-foreground">
                {item.description ?? "Описание задачи скоро появится."}
              </p>
            </section>
            <section>
              <h2 className="mb-3 text-xl font-semibold tracking-normal">
                Цель
              </h2>
              <p className="whitespace-pre-line leading-8 text-muted-foreground">
                {item.goal ?? "Цель будет уточнена заказчиком."}
              </p>
            </section>
          </div>
        </article>
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Параметры</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground">Бюджет</div>
                <div className="font-medium">{formatTenderBudget(item)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Дедлайн</div>
                <div className="font-medium">{formatDate(item.deadline)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Статус</div>
                <div className="font-medium">{item.status ?? "published"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Создана</div>
                <div className="font-medium">{formatDate(item.created_at)}</div>
              </div>
            </CardContent>
          </Card>

          {message ? (
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              {message}
            </div>
          ) : null}

          {!user ? (
            <Card>
              <CardHeader>
                <CardTitle>Отклик</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Войдите, чтобы откликнуться на задачу.
                </p>
                <Button asChild className="w-full">
                  <Link href="/login">Войти</Link>
                </Button>
              </CardContent>
            </Card>
          ) : isOwner ? (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Вы автор этой задачи, отклик недоступен.
              </CardContent>
            </Card>
          ) : responseOptions.length === 0 ? (
            <Card>
              <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                <p>
                  Чтобы откликаться на задачи, создайте профиль эксперта или
                  организацию-подрядчика.
                </p>
                <Button asChild variant="outline">
                  <Link href="/dashboard/expert">Создать профиль эксперта</Link>
                </Button>
              </CardContent>
            </Card>
          ) : hasResponse ? (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Вы уже откликнулись на эту задачу.
              </CardContent>
            </Card>
          ) : (
            <ResponseForm
              action={createTenderResponse.bind(null, item.id)}
              options={responseOptions}
            />
          )}
        </aside>
      </div>
    </PageShell>
  )
}
