import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/supabase/queries"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Настройки</h1>
        <p className="mt-2 text-muted-foreground">
          Настройки пользователя и аккаунта.
        </p>
      </div>
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
    </div>
  )
}
