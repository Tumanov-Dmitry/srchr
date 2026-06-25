import { updateAdminTenderStatus } from "@/app/actions/admin"
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
import { getAdminTenders } from "@/lib/supabase/admin-queries"

const statuses = [
  "draft",
  "moderation",
  "published",
  "closed",
  "rejected",
  "archived",
]
const statusOptions = statuses.map((status) => ({
  value: status,
  label: status,
}))

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
        <h1 className="type-h1">Задачи</h1>
        <p className="type-body mt-2 text-muted-foreground">
          Контроль заданий и мини-тендеров компаний.
        </p>
      </div>
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Список задач</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Задача</TableHead>
                <TableHead>Компания</TableHead>
                <TableHead>Бюджет</TableHead>
                <TableHead>Срок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создана</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenders.map((tender) => (
                <TableRow key={tender.id}>
                  <TableCell>
                    <div className="font-medium">{tender.title}</div>
                    <div className="max-w-md truncate text-xs text-muted-foreground">
                      {tender.description ?? tender.slug}
                    </div>
                  </TableCell>
                  <TableCell>{tender.organizations?.name ?? "—"}</TableCell>
                  <TableCell>
                    {tender.budget_from || tender.budget_to
                      ? `${tender.budget_from ?? "—"}–${tender.budget_to ?? "—"}`
                      : (tender.budget ?? "—")}
                  </TableCell>
                  <TableCell>
                    {tender.deadline
                      ? new Date(tender.deadline).toLocaleDateString("ru-RU")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge>{tender.status ?? "draft"}</Badge>
                  </TableCell>
                  <TableCell>
                    {tender.created_at
                      ? new Date(tender.created_at).toLocaleDateString("ru-RU")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <AdminStatusForm
                      action={updateAdminTenderStatus}
                      defaultValue={tender.status ?? "draft"}
                      id={tender.id}
                      options={statusOptions}
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
