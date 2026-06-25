import { updateAdminProfile } from "@/app/actions/admin"
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
import { getAdminProfiles } from "@/lib/supabase/admin-queries"

const roleOptions = ["guest", "contractor", "client", "admin"].map((role) => ({
  value: role,
  label: role,
}))

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const profiles = await getAdminProfiles()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1">Пользователи</h1>
        <p className="type-body mt-2 text-muted-foreground">
          Роли, подтверждение и последняя активность пользователей.
        </p>
      </div>
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[1160px]">
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Тип аккаунта</TableHead>
                <TableHead>Подтверждение</TableHead>
                <TableHead>Последняя активность</TableHead>
                <TableHead>Провайдер</TableHead>
                <TableHead>Регистрация</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.email ?? "Без email"}</TableCell>
                  <TableCell>
                    {profile.full_name ?? profile.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {profile.role ?? profile.account_type ?? "guest"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        profile.email_confirmed_at || profile.phone_confirmed_at
                          ? "default"
                          : "outline"
                      }
                    >
                      {profile.email_confirmed_at || profile.phone_confirmed_at
                        ? "подтверждён"
                        : "не подтверждён"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.last_seen_at
                      ? new Date(profile.last_seen_at).toLocaleString("ru-RU")
                      : "—"}
                  </TableCell>
                  <TableCell>{profile.providers ?? "email"}</TableCell>
                  <TableCell>
                    {(profile.auth_created_at ?? profile.created_at)
                      ? new Date(
                          profile.auth_created_at ?? profile.created_at ?? "",
                        ).toLocaleDateString("ru-RU")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground">
                      {profile.id}
                    </code>
                  </TableCell>
                  <TableCell>
                    <AdminStatusForm
                      action={updateAdminProfile}
                      defaultValue={
                        profile.role ?? profile.account_type ?? "guest"
                      }
                      id={profile.id}
                      name="account_type"
                      options={roleOptions}
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
