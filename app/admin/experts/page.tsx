import Link from "next/link"

import { updateAdminExpertStatus } from "@/app/actions/admin"
import { AdminStatusForm } from "@/components/admin/status-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { getAdminExperts } from "@/lib/supabase/admin-queries"

const statuses = ["draft", "published", "hidden", "blocked", "archived"]
const statusOptions = statuses.map((status) => ({
  value: status,
  label: status,
}))

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
        <h1 className="type-h1">Эксперты</h1>
        <p className="mt-2 text-muted-foreground">
          Публичные профили специалистов, их статус и видимость.
        </p>
      </div>
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Список экспертов</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Эксперт</TableHead>
                <TableHead>Город</TableHead>
                <TableHead>Специализации</TableHead>
                <TableHead>Публичность</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experts.map((expert) => (
                <TableRow key={expert.id}>
                  <TableCell>
                    <div className="font-medium">
                      {[expert.first_name, expert.last_name]
                        .filter(Boolean)
                        .join(" ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      /@{expert.slug}
                    </div>
                  </TableCell>
                  <TableCell>{expert.city ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {expert.specializations ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={expert.is_public ? "default" : "outline"}>
                      {expert.is_public ? "публичный" : "скрытый"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{expert.status ?? "draft"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/@${expert.slug}`}>Открыть</Link>
                      </Button>
                      <AdminStatusForm
                        action={updateAdminExpertStatus}
                        defaultValue={expert.status ?? "draft"}
                        id={expert.id}
                        options={statusOptions}
                      />
                    </div>
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
