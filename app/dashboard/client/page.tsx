import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOnboardingState } from "@/lib/supabase/queries"

export default async function ClientDashboardPage() {
  const state = await getOnboardingState()
  const organization = state.memberships?.find(
    (membership) => membership.organizations?.is_client,
  )?.organizations

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="type-h1">
            Кабинет заказчика
          </h1>
          <p className="type-body mt-2 text-muted-foreground">
            {organization?.name ?? "Организация"} · задачи, отклики и избранные подрядчики.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/client/tenders/new">Создать задачу</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Задачи", "Создавайте задачи и собирайте отклики."],
          ["Подрядчики", "Сохраняйте подходящие организации."],
          ["Отклики", "Сравнивайте ответы подрядчиков."],
        ].map(([title, description]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {description}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
