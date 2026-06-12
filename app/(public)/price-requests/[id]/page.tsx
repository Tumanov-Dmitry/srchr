import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PriceRequestInsightsCard } from "@/components/price-requests/price-request-insights"
import { PriceRequestResponseForm } from "@/components/price-requests/price-request-response-form"
import { decodeMessage } from "@/lib/messages"
import { getPriceRequestById } from "@/lib/supabase/price-request-queries"

const formatLabels = {
  online: "Онлайн",
  offline: "Офлайн",
  hybrid: "Гибрид",
}

export default async function PriceRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const { id } = await params
  const result = await getPriceRequestById(id)
  if (!result.user) redirect(`/login?next=/price-requests/${id}`)
  if (!result.request) notFound()

  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const request = result.request

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {message ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
            {message}
          </div>
        ) : null}
        <header className="space-y-4 border-b pb-8">
          <div className="flex flex-wrap gap-2">
            <Badge>{request.service_category}</Badge>
            <Badge variant="outline">{formatLabels[request.format]}</Badge>
            {request.industry ? (
              <Badge variant="secondary">{request.industry}</Badge>
            ) : null}
          </div>
          <h1 className="type-h1">{request.title}</h1>
          <p className="max-w-3xl whitespace-pre-wrap text-muted-foreground">
            {request.description}
          </p>
        </header>

        <PriceRequestInsightsCard insights={result.insights} />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Параметры проекта</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Detail label="Масштаб" value={request.project_scale} />
              <Detail label="Локация" value={request.location} />
              <Detail
                label="Ожидаемый старт"
                value={request.expected_start_date}
                date
              />
              <Detail label="Дедлайн" value={request.expected_deadline} date />
              <Detail
                label="Заказчик"
                value={request.organizations?.name ?? "Личный запрос"}
              />
              <Detail label="Статус" value={request.status} />
            </CardContent>
          </Card>
          {!result.isOwner && request.status === "active" ? (
            <PriceRequestResponseForm
              options={result.responderOptions}
              requestId={request.id}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Полученные оценки</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {result.responses.length}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {result.isOwner
                    ? "Детали оценок доступны ниже."
                    : "Вы уже видите собственную оценку, если отправляли ее."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {result.responses.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Оценки исполнителей</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {result.responses.map((response) => {
                const name =
                  response.responder_type === "expert"
                    ? [
                        response.expert_profiles?.first_name,
                        response.expert_profiles?.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ")
                    : response.organizations?.name
                return (
                  <div
                    className="space-y-3 py-5 first:pt-0 last:pb-0"
                    key={response.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <strong>{name || "Исполнитель"}</strong>
                      <Badge
                        variant={
                          response.willing_to_participate
                            ? "default"
                            : "outline"
                        }
                      >
                        {response.willing_to_participate
                          ? "Готов участвовать"
                          : "Только оценка"}
                      </Badge>
                    </div>
                    <p className="font-medium">
                      {Number(response.min_cost).toLocaleString("ru-RU")} —{" "}
                      {Number(response.max_cost).toLocaleString("ru-RU")} ₽ ·{" "}
                      {response.min_duration_days}–{response.max_duration_days}{" "}
                      дней
                    </p>
                    {response.comment ? (
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {response.comment}
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  )
}

function Detail({
  label,
  value,
  date = false,
}: {
  label: string
  value?: string | null
  date?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">
        {value
          ? date
            ? new Date(value).toLocaleDateString("ru-RU")
            : value
          : "Не указано"}
      </p>
    </div>
  )
}
