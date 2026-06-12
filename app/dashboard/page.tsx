import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOnboardingState } from "@/lib/supabase/queries"

export default async function DashboardPage() {
  const state = await getOnboardingState()

  if (!state.isComplete) {
    redirect("/dashboard/onboarding")
  }

  if (state.primaryRole) {
    redirect(state.dashboardPath)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">
          Личный кабинет
        </h1>
        <p className="mt-2 text-muted-foreground">
          {state.user?.email} · управляйте профилем, организациями, задачами и
          кейсами.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Организации", "Связи через organization_members"],
          ["Задачи", "Создание и управление задачами"],
          ["Отклики", "Ответы подрядчиков и заказчиков"],
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
      <Tabs defaultValue="next">
        <TabsList>
          <TabsTrigger value="next">Ближайшее</TabsTrigger>
          <TabsTrigger value="profile">Профиль</TabsTrigger>
        </TabsList>
        <TabsContent
          value="next"
          className="rounded-lg border bg-background p-5"
        >
          MVP-дашборд готов к подключению реальных виджетов.
        </TabsContent>
        <TabsContent
          value="profile"
          className="rounded-lg border bg-background p-5"
        >
          Тип аккаунта хранится в profiles и выбирается при регистрации.
        </TabsContent>
      </Tabs>
    </div>
  )
}
