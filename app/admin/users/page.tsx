import { updateAdminProfile } from "@/app/actions/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getAdminProfiles } from "@/lib/supabase/admin-queries"

const roles = ["guest", "contractor", "client", "both", "admin"]

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
        <h1 className="text-3xl font-semibold tracking-normal">Пользователи</h1>
        <p className="mt-2 text-muted-foreground">
          Просмотр ролей, типов аккаунтов и статусов пользователей.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Имя</th>
                <th className="py-3 pr-4">Тип аккаунта</th>
                <th className="py-3 pr-4">Дата регистрации</th>
                <th className="py-3 pr-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr className="border-b last:border-0" key={profile.id}>
                  <td className="py-3 pr-4">{profile.email ?? "Без email"}</td>
                  <td className="py-3 pr-4">{profile.full_name ?? profile.name ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline">
                      {profile.role ?? profile.account_type ?? "guest"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    {profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString("ru-RU")
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <form action={updateAdminProfile} className="flex flex-wrap gap-2">
                      <input name="id" type="hidden" value={profile.id} />
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2"
                        defaultValue={profile.role ?? profile.account_type ?? "guest"}
                        name="account_type"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
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
