import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminStats } from "@/lib/supabase/admin-queries"

const rows = [
  ["agencies", "Количество зарегистрированных агентств"],
  ["clients", "Количество зарегистрированных HR / компаний"],
  ["specialists", "Количество специалистов"],
  ["publishedCases", "Количество опубликованных кейсов"],
  ["publishedArticles", "Количество опубликованных статей"],
  ["moderationMaterials", "Количество материалов на модерации"],
  ["activeTenders", "Количество активных заданий"],
  ["tenderResponses", "Количество откликов на задания"],
  ["subscriptions", "Количество платных подписок"],
  ["requests", "Количество заявок / обращений"],
] as const

export default async function AdminStatsPage() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1">Статистика</h1>
        <p className="type-body mt-2 text-muted-foreground">
          Базовые продуктовые показатели. Фильтры по периодам будут добавлены следующим шагом.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Показатели платформы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {rows.map(([key, label]) => (
              <div className="flex items-center justify-between gap-4 py-3" key={key}>
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-lg font-semibold">{stats[key]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
