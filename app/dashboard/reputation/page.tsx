import Link from "next/link"
import { redirect } from "next/navigation"
import { Award, ExternalLink } from "@/components/ui/icons"

import { EmptyState } from "@/components/srchr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
        <h1 className="type-h1">Репутация</h1>
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
                        <Award className="size-7 text-primary" />
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
                        <ExternalLink />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Источники репутации</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {reputationCategoryOrder.map((category) => {
                        const breakdown = target.breakdown.find(
                          (item) => item.category === category,
                        )
                        return (
                          <Card className="shadow-none" key={category}>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">
                                {reputationCategoryLabels[category]}
                              </p>
                              <p className="mt-2 text-2xl font-semibold">
                                {(breakdown?.total_points ?? 0).toLocaleString(
                                  "ru-RU",
                                )}
                              </p>
                            </CardContent>
                          </Card>
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
                        <Table className="min-w-[620px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Дата</TableHead>
                              <TableHead>Событие</TableHead>
                              <TableHead className="text-right">
                                Баллы
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {target.events.map((event) => (
                              <TableRow key={event.id}>
                                <TableCell>
                                  {formatDate(event.created_at)}
                                </TableCell>
                                <TableCell>
                                  {reputationEventLabels[event.event_type] ??
                                    event.event_type}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {event.points > 0 ? "+" : ""}
                                  {event.points}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <EmptyState
                        description="Баллы появятся после действий на платформе."
                        icon={Award}
                        title="Начислений пока нет"
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      ) : (
        <EmptyState
          description="Создайте профиль эксперта или организацию-подрядчика."
          icon={Award}
          title="Репутация пока не начисляется"
        />
      )}
    </div>
  )
}
