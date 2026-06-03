import { saveNotificationPreferences } from "@/app/actions/notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { decodeMessage } from "@/lib/messages"
import {
  getNotificationPreferences,
  notificationPreferenceGroups,
} from "@/lib/supabase/notification-queries"
import { getCurrentUser } from "@/lib/supabase/queries"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const user = await getCurrentUser()
  const { preferences, isNotificationsTableMissing } =
    await getNotificationPreferences()
  const preferencesByKey = new Map(
    preferences.map((preference) => [preference.event_key, preference]),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Настройки</h1>
        <p className="mt-2 text-muted-foreground">
          Настройки пользователя, аккаунта и уведомлений.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="max-w-xl space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} readOnly />
            </div>
            <Button type="button">Сохранить</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Уведомления</CardTitle>
        </CardHeader>
        <CardContent>
          {isNotificationsTableMissing ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Примените SQL из supabase/sql/create-notifications.sql, чтобы
              включить настройки уведомлений.
            </div>
          ) : (
            <form action={saveNotificationPreferences} className="space-y-6">
              {notificationPreferenceGroups.map((group) => (
                <div className="space-y-3" key={group.category}>
                  <h2 className="font-medium">{group.title}</h2>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[620px] text-sm">
                      <thead className="bg-secondary/60 text-left text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Событие</th>
                          <th className="px-3 py-2">В платформе</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Telegram</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map(([eventKey, label]) => {
                          const preference = preferencesByKey.get(eventKey)

                          return (
                            <tr className="border-t" key={eventKey}>
                              <td className="px-3 py-3">{label}</td>
                              <td className="px-3 py-3">
                                <input
                                  defaultChecked={preference?.in_app ?? true}
                                  name={`${eventKey}:in_app`}
                                  type="checkbox"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  defaultChecked={preference?.email ?? false}
                                  name={`${eventKey}:email`}
                                  type="checkbox"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  defaultChecked={preference?.telegram ?? false}
                                  name={`${eventKey}:telegram`}
                                  type="checkbox"
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <Button type="submit">Сохранить уведомления</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
