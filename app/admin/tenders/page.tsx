import { updateAdminTenderStatus } from "@/app/actions/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getAdminTenders } from "@/lib/supabase/admin-queries"

const statuses = ["draft", "moderation", "published", "closed", "rejected", "archived"]

export default async function AdminTendersPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const tenders = await getAdminTenders()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Задачи</h1>
        <p className="mt-2 text-muted-foreground">
          Контроль заданий и мини-тендеров, которые публикуют компании.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Список задач</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">Задача</th>
                <th className="py-3 pr-4">Компания</th>
                <th className="py-3 pr-4">Бюджет</th>
                <th className="py-3 pr-4">Срок</th>
                <th className="py-3 pr-4">Статус</th>
                <th className="py-3 pr-4">Создана</th>
                <th className="py-3 pr-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((tender) => (
                <tr className="border-b last:border-0" key={tender.id}>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{tender.title}</div>
                    <div className="max-w-md truncate text-xs text-muted-foreground">
                      {tender.description ?? tender.slug}
                    </div>
                  </td>
                  <td className="py-3 pr-4">{tender.organizations?.name ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {tender.budget_from || tender.budget_to
                      ? `${tender.budget_from ?? "—"}–${tender.budget_to ?? "—"}`
                      : tender.budget ?? "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {tender.deadline
                      ? new Date(tender.deadline).toLocaleDateString("ru-RU")
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge>{tender.status ?? "draft"}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    {tender.created_at
                      ? new Date(tender.created_at).toLocaleDateString("ru-RU")
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <form action={updateAdminTenderStatus} className="flex gap-2">
                      <input name="id" type="hidden" value={tender.id} />
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2"
                        defaultValue={tender.status ?? "draft"}
                        name="status"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" type="submit">
                        Сохранить
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
