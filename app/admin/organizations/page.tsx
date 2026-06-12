import { updateAdminOrganizationStatus } from "@/app/actions/admin"
import { AdminStatusForm } from "@/components/admin/status-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { decodeMessage } from "@/lib/messages"
import { getAdminOrganizations } from "@/lib/supabase/admin-queries"

const statuses = [
  "draft",
  "moderation",
  "published",
  "rejected",
  "archived",
  "blocked",
]
const statusOptions = statuses.map((status) => ({
  value: status,
  label: status,
}))

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
        <h1 className="type-h1">Компании и агентства</h1>
        <p className="mt-2 text-muted-foreground">
          Управление карточками подрядчиков и заказчиков.
        </p>
      </div>
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Организации</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Город</TableHead>
                <TableHead>Услуги</TableHead>
                <TableHead>Обновлена</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((organization) => (
                <TableRow key={organization.id}>
                  <TableCell>
                    <div className="font-medium">{organization.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {organization.slug}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {organization.is_contractor ? (
                        <Badge variant="outline">подрядчик</Badge>
                      ) : null}
                      {organization.is_client ? (
                        <Badge variant="outline">заказчик</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{organization.status ?? "draft"}</Badge>
                  </TableCell>
                  <TableCell>{organization.city ?? "—"}</TableCell>
                  <TableCell>
                    {organization.organization_services?.length ?? 0}
                  </TableCell>
                  <TableCell>
                    {organization.updated_at
                      ? new Date(organization.updated_at).toLocaleDateString(
                          "ru-RU",
                        )
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <AdminStatusForm
                      action={updateAdminOrganizationStatus}
                      defaultValue={organization.status ?? "draft"}
                      id={organization.id}
                      options={statusOptions}
                      submitLabel="Обновить"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
