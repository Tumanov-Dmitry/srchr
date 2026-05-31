import { updateAdminOrganizationStatus } from "@/app/actions/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getAdminOrganizations } from "@/lib/supabase/admin-queries"

const statuses = ["draft", "moderation", "published", "rejected", "archived", "blocked"]

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const organizations = await getAdminOrganizations()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Компании и агентства</h1>
        <p className="mt-2 text-muted-foreground">
          Управление карточками подрядчиков, заказчиков и смешанных организаций.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Карточки организаций</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">Название</th>
                <th className="py-3 pr-4">Тип</th>
                <th className="py-3 pr-4">Статус</th>
                <th className="py-3 pr-4">Город</th>
                <th className="py-3 pr-4">Услуги</th>
                <th className="py-3 pr-4">Обновлена</th>
                <th className="py-3 pr-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => (
                <tr className="border-b last:border-0" key={organization.id}>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{organization.name}</div>
                    <div className="text-xs text-muted-foreground">{organization.slug}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {organization.is_contractor ? <Badge variant="outline">подрядчик</Badge> : null}
                      {organization.is_client ? <Badge variant="outline">заказчик</Badge> : null}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge>{organization.status ?? "draft"}</Badge>
                  </td>
                  <td className="py-3 pr-4">{organization.city ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {organization.organization_services?.length ?? 0}
                  </td>
                  <td className="py-3 pr-4">
                    {organization.updated_at
                      ? new Date(organization.updated_at).toLocaleDateString("ru-RU")
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <form action={updateAdminOrganizationStatus} className="flex gap-2">
                      <input name="id" type="hidden" value={organization.id} />
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2"
                        defaultValue={organization.status ?? "draft"}
                        name="status"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" type="submit">
                        Обновить
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
