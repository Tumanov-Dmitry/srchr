import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminStats } from "@/lib/supabase/admin-queries"

const statCards = [
  ["agencies", "Агентства"],
  ["clients", "HR / компании"],
  ["specialists", "Специалисты"],
  ["publishedCases", "Опубликованные кейсы"],
  ["publishedArticles", "Опубликованные статьи"],
  ["moderationMaterials", "Материалы на модерации"],
  ["activeTenders", "Активные задачи"],
  ["tenderResponses", "Отклики"],
  ["subscriptions", "Активные подписки"],
  ["requests", "Заявки / обращения"],
] as const

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Админка</h1>
          <p className="mt-2 text-muted-foreground">
            Управление пользователями, компаниями, модерацией и задачами платформы.
          </p>
        </div>
        <Badge variant="outline">MVP</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map(([key, label]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats[key]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Button asChild variant="outline">
            <Link href="/admin/materials">Модерация материалов</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/organizations">Карточки компаний</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/tenders">Задачи</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">Пользователи</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
