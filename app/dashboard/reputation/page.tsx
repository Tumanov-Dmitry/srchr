import Link from "next/link"
import { redirect } from "next/navigation"
import { Award, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  reputationCategoryLabels,
  reputationCategoryOrder,
  reputationEventLabels,
} from "@/lib/reputation"
import { getDashboardReputation } from "@/lib/supabase/queries"
import { formatDate } from "@/lib/utils"

export default async function DashboardReputationPage() {
  const { user, targets, isReputationTableMissing } =
    await getDashboardReputation()

  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Репутация</h1>
        <p className="mt-2 text-muted-foreground">
          Баллы, источники начислений и история изменений.
        </p>
      </div>

      {isReputationTableMissing ? (
        <Card>
          <CardHeader>
            <CardTitle>Нужен модуль репутации</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Примените SQL из supabase/sql/create-reputation.sql.
          </CardContent>
        </Card>
      ) : null}

      {targets.length > 0 ? (
        <Tabs defaultValue={`${targets[0].targetType}:${targets[0].targetId}`}>
          {targets.length > 1 ? (
            <TabsList className="h-auto flex-wrap justify-start">
              {targets.map((target) => (
                <TabsTrigger
                  key={`${target.targetType}:${target.targetId}`}
                  value={`${target.targetType}:${target.targetId}`}
                >
                  {target.name}
                </TabsTrigger>
              ))}
            </TabsList>
          ) : null}

          {targets.map((target) => {
            const summary = target.summary

            return (
              <TabsContent
                className="space-y-6"
                key={`${target.targetType}:${target.targetId}`}
                value={`${target.targetType}:${target.targetId}`}
              >
                <Card>
                  <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Текущая репутация
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <Award className="h-7 w-7 text-primary" />
                        <p className="text-4xl font-semibold">
                          {(summary?.total_points ?? 0).toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {summary?.reviews_count ?? 0} отзывов ·{" "}
                        {summary?.recommendations_count ?? 0} рекомендаций
                      </p>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={`${target.href}#reputation`}>
                        Открыть профиль
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Источники репутации</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2 lg:grid-cols-4">
                      {reputationCategoryOrder.map((category) => {
                        const breakdown = target.breakdown.find(
                          (item) => item.category === category,
                        )

                        return (
                          <div className="bg-background p-4" key={category}>
                            <p className="text-sm text-muted-foreground">
                              {reputationCategoryLabels[category]}
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                              {(breakdown?.total_points ?? 0).toLocaleString(
                                "ru-RU",
                              )}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Последние начисления</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {target.events.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-sm">
                          <thead className="text-left text-muted-foreground">
                            <tr className="border-b">
                              <th className="py-3 pr-4">Дата</th>
                              <th className="py-3 pr-4">Событие</th>
                              <th className="py-3 text-right">Баллы</th>
                            </tr>
                          </thead>
                          <tbody>
                            {target.events.map((event) => (
                              <tr
                                className="border-b last:border-0"
                                key={event.id}
                              >
                                <td className="py-3 pr-4">
                                  {formatDate(event.created_at)}
                                </td>
                                <td className="py-3 pr-4">
                                  {reputationEventLabels[event.event_type] ??
                                    event.event_type}
                                </td>
                                <td className="py-3 text-right font-medium">
                                  {event.points > 0 ? "+" : ""}
                                  {event.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Начислений пока нет.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Следующие возможности</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Архитектура готова для уровней, достижений, бейджей и
                    динамики роста по месяцам.
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Создайте профиль эксперта или организацию-подрядчика, чтобы
            накапливать репутацию.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
