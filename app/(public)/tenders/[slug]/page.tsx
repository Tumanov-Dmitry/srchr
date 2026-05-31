import { notFound } from "next/navigation"
import { createTenderResponse } from "@/app/actions/tenders"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/layout/page-shell"
import { ResponseForm } from "@/components/tenders/response-form"
import {
  getCurrentContractorOrganization,
  getCurrentUser,
  getTenderBySlug,
  getUserOrganizationMemberships,
} from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/server"
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

export default async function TenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const [{ slug }, { message }] = await Promise.all([params, searchParams])
  const [tender, user, contractorState] = await Promise.all([
    getTenderBySlug(slug),
    getCurrentUser(),
    getCurrentContractorOrganization(),
  ])

  if (!tender) notFound()

  const item = tender as Tender
  const memberships = user ? await getUserOrganizationMemberships(user.id) : []
  const isOwner = memberships.some(
    (membership) => membership.organizations?.id === item.organization_id,
  )
  let hasResponse = false

  if (contractorState.organization) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("tender_responses")
      .select("id")
      .eq("tender_id", item.id)
      .eq("organization_id", contractorState.organization.id)
      .maybeSingle()

    hasResponse = Boolean(data)
  }

  return (
    <PageShell>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <article>
          <p className="mb-3 text-sm font-medium text-primary">
            {item.organizations?.name ?? "Компания"}
          </p>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            {item.title}
          </h1>
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="mb-3 text-xl font-semibold tracking-normal">Описание</h2>
              <p className="whitespace-pre-line leading-8 text-muted-foreground">
                {item.description ?? "Описание задачи скоро появится."}
              </p>
            </section>
            <section>
              <h2 className="mb-3 text-xl font-semibold tracking-normal">Цель</h2>
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
                  <a href="/login">Войти</a>
                </Button>
              </CardContent>
            </Card>
          ) : isOwner ? (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Вы автор этой задачи, отклик недоступен.
              </CardContent>
            </Card>
          ) : !contractorState.organization ? (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Отклики доступны подрядчикам после onboarding.
              </CardContent>
            </Card>
          ) : hasResponse ? (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Вы уже откликнулись на эту задачу.
              </CardContent>
            </Card>
          ) : (
            <ResponseForm action={createTenderResponse.bind(null, item.id)} />
          )}
        </aside>
      </div>
    </PageShell>
  )
}
