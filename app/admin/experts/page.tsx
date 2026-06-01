import Link from "next/link"
import { updateAdminExpertStatus } from "@/app/actions/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getAdminExperts } from "@/lib/supabase/admin-queries"

const statuses = ["draft", "published", "hidden", "blocked", "archived"]

export default async function AdminExpertsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const experts = await getAdminExperts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Эксперты</h1>
        <p className="mt-2 text-muted-foreground">
          Публичные профили специалистов, их статус и видимость.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Список экспертов</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">Эксперт</th>
                <th className="py-3 pr-4">Город</th>
                <th className="py-3 pr-4">Специализации</th>
                <th className="py-3 pr-4">Публичность</th>
                <th className="py-3 pr-4">Статус</th>
                <th className="py-3 pr-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {experts.map((expert) => (
                <tr className="border-b last:border-0" key={expert.id}>
                  <td className="py-3 pr-4">
                    <div className="font-medium">
                      {[expert.first_name, expert.last_name].filter(Boolean).join(" ")}
                    </div>
                    <div className="text-xs text-muted-foreground">/@{expert.slug}</div>
                  </td>
                  <td className="py-3 pr-4">{expert.city ?? "—"}</td>
                  <td className="max-w-xs truncate py-3 pr-4">
                    {expert.specializations ?? "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {expert.is_public ? <Badge>публичный</Badge> : <Badge variant="outline">скрытый</Badge>}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge>{expert.status ?? "draft"}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/@${expert.slug}`}>Открыть</Link>
                      </Button>
                      <form action={updateAdminExpertStatus} className="flex gap-2">
                        <input name="id" type="hidden" value={expert.id} />
                        <select
                          className="h-9 rounded-md border border-input bg-background px-2"
                          defaultValue={expert.status ?? "draft"}
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
                    </div>
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
