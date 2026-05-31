import { redirect } from "next/navigation"
import { updateTenderResponseStatus } from "@/app/actions/tenders"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTenderResponses } from "@/lib/supabase/queries"
import { formatDate } from "@/lib/utils"

export default async function ClientTenderResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const [{ id }, { message }] = await Promise.all([params, searchParams])
  const { user, organization, tender, responses } = await getTenderResponses(id)

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")
  if (!tender) redirect("/dashboard/client/tenders")

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
        {responses.map((response) => (
          <Card key={response.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <CardTitle className="text-lg">
                  {response.organizations?.name ?? "Подрядчик"}
                </CardTitle>
                <Badge>{response.status ?? "sent"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {response.message ?? "Сообщение не заполнено."}
              </p>
              <div className="grid gap-1 text-sm text-muted-foreground">
                <div>Email: {response.organizations?.email ?? "не указан"}</div>
                <div>Телефон: {response.organizations?.phone ?? "не указан"}</div>
              </div>
              <div className="text-sm text-muted-foreground">
                Дата отклика: {formatDate(response.created_at)}
              </div>
              <form
                action={updateTenderResponseStatus.bind(null, id, response.id)}
                className="flex flex-wrap gap-2"
              >
                <select
                  name="status"
                  defaultValue={response.status ?? "sent"}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="viewed">Просмотрен</option>
                  <option value="accepted">Принят</option>
                  <option value="rejected">Отклонен</option>
                </select>
                <Button type="submit" variant="outline">Обновить статус</Button>
              </form>
            </CardContent>
          </Card>
        ))}
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
