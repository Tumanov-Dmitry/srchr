import { BellOff } from "@/components/ui/icons"

import { saveNotificationPreferences } from "@/app/actions/notifications"
import { EmptyState } from "@/components/srchr"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
        <h1 className="type-h1">Настройки</h1>
        <p className="type-body mt-2 text-muted-foreground">
          Аккаунт и каналы уведомлений.
        </p>
      </div>
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="max-w-xl space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" readOnly value={user?.email ?? ""} />
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
            <EmptyState
              description="Примените SQL-патч уведомлений, чтобы включить настройки каналов."
              icon={BellOff}
              title="Настройки уведомлений недоступны"
            />
          ) : (
            <form action={saveNotificationPreferences} className="space-y-6">
              {notificationPreferenceGroups.map((group) => (
                <div className="space-y-3" key={group.category}>
                  <h2 className="font-medium">{group.title}</h2>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table className="min-w-[620px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Событие</TableHead>
                          <TableHead>В платформе</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telegram</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map(([eventKey, label]) => {
                          const preference = preferencesByKey.get(eventKey)
                          return (
                            <TableRow key={eventKey}>
                              <TableCell>{label}</TableCell>
                              <TableCell>
                                <Checkbox
                                  defaultChecked={preference?.in_app ?? true}
                                  name={`${eventKey}:in_app`}
                                />
                              </TableCell>
                              <TableCell>
                                <Checkbox
                                  defaultChecked={preference?.email ?? false}
                                  name={`${eventKey}:email`}
                                />
                              </TableCell>
                              <TableCell>
                                <Checkbox
                                  defaultChecked={preference?.telegram ?? false}
                                  name={`${eventKey}:telegram`}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
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
