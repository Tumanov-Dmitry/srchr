import Link from "next/link"
import { redirect } from "next/navigation"
import { updateTenderResponseStatus } from "@/app/actions/tenders"
import { ReputationStats } from "@/components/reputation/reputation-stats"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SelectField } from "@/components/ui/select-field"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getReputationSummaries,
  getTenderResponses,
} from "@/lib/supabase/queries"
import { formatDate } from "@/lib/utils"

export default async function ClientTenderResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const [{ id }, { message }] = await Promise.all([params, searchParams])
  const { user, organizations, tender, responses } =
    await getTenderResponses(id)

  if (!user) redirect("/login")
  if (organizations.length === 0) redirect("/onboarding")
  if (!tender) redirect("/dashboard/client/tenders")

  const contractorIds = responses
    .filter((response) => response.responder_type !== "expert")
    .map((response) => response.organization_id)
    .filter((targetId): targetId is string => Boolean(targetId))
  const expertIds = responses
    .filter((response) => response.responder_type === "expert")
    .map((response) => response.expert_id)
    .filter((targetId): targetId is string => Boolean(targetId))
  const [contractorReputation, expertReputation] = await Promise.all([
    getReputationSummaries("contractor", contractorIds),
    getReputationSummaries("expert", expertIds),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Отклики</h1>
        <p className="mt-2 text-muted-foreground">{tender.title}</p>
      </div>

      {message ? (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4">
        {responses.map((response) => {
          const isExpert = response.responder_type === "expert"
          const expert = response.expert_profiles
          const name = isExpert
            ? [expert?.first_name, expert?.last_name]
                .filter(Boolean)
                .join(" ") || "Эксперт"
            : (response.organizations?.name ?? "Подрядчик")
          const href = isExpert
            ? expert?.slug
              ? `/@${expert.slug}`
              : undefined
            : response.organizations?.slug
              ? `/contractors/${response.organizations.slug}`
              : undefined
          const reputation = isExpert
            ? response.expert_id
              ? expertReputation.get(response.expert_id)
              : null
            : response.organization_id
              ? contractorReputation.get(response.organization_id)
              : null

          return (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">
                      {href ? <Link href={href}>{name}</Link> : name}
                    </CardTitle>
                    <ReputationStats
                      compact
                      href={href ? `${href}#reputation` : undefined}
                      summary={reputation}
                    />
                  </div>
                  <Badge>{response.status ?? "sent"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {response.message ?? "Сообщение не заполнено."}
                </p>
                {!isExpert ? (
                  <div className="grid gap-1 text-sm text-muted-foreground">
                    <div>
                      Email: {response.organizations?.email ?? "не указан"}
                    </div>
                    <div>
                      Телефон: {response.organizations?.phone ?? "не указан"}
                    </div>
                  </div>
                ) : null}
                <div className="text-sm text-muted-foreground">
                  Дата отклика: {formatDate(response.created_at)}
                </div>
                <form
                  action={updateTenderResponseStatus.bind(
                    null,
                    id,
                    response.id,
                  )}
                  className="flex flex-wrap gap-2"
                >
                  <SelectField
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={response.status ?? "sent"}
                    name="status"
                  >
                    <option value="viewed">Просмотрен</option>
                    <option value="accepted">Принят</option>
                    <option value="rejected">Отклонён</option>
                  </SelectField>
                  <Button type="submit" variant="outline">
                    Обновить статус
                  </Button>
                </form>
              </CardContent>
            </Card>
          )
        })}
        {responses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Откликов пока нет.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
