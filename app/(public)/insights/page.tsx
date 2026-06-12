import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Eye,
  FileText,
  Users,
} from "lucide-react"

import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { EmptyState } from "@/components/srchr"
import { Badge } from "@/components/ui/badge"
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
import { getMarketInsights } from "@/lib/supabase/insights-queries"

export const dynamic = "force-dynamic"

const number = new Intl.NumberFormat("ru-RU")
const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
})

export default async function InsightsPage() {
  const insights = await getMarketInsights()
  const totals = [
    {
      label: "Подрядчики",
      value: insights.totals.contractors,
      icon: Building2,
    },
    { label: "Эксперты", value: insights.totals.experts, icon: Users },
    {
      label: "Задачи",
      value: insights.totals.tenders,
      icon: BriefcaseBusiness,
    },
    { label: "Материалы", value: insights.totals.materials, icon: FileText },
    { label: "Просмотры", value: insights.totals.views, icon: Eye },
  ]

  return (
    <PageShell>
      <PageHeader
        description="Агрегированные данные SRCHR по услугам, участникам рынка, задачам и публикациям."
        title="Аналитика рынка"
      />
      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {totals.map((item) => (
          <Card className="shadow-none" key={item.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className="size-4" />
                {item.label}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {number.format(item.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      <Tabs defaultValue="services">
        <TabsList className="mb-5 h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="services">Услуги</TabsTrigger>
          <TabsTrigger value="demand">Спрос</TabsTrigger>
          <TabsTrigger value="contractors">Подрядчики</TabsTrigger>
          <TabsTrigger value="experts">Эксперты</TabsTrigger>
          <TabsTrigger value="research">Исследования</TabsTrigger>
        </TabsList>
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Структура рынка по услугам</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {insights.services.length > 0 ? (
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Услуга</TableHead>
                      <TableHead>Подрядчики</TableHead>
                      <TableHead>Эксперты</TableHead>
                      <TableHead>Задачи</TableHead>
                      <TableHead>Кейсы</TableHead>
                      <TableHead>Средний бюджет</TableHead>
                      <TableHead>Средний срок</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insights.services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">
                          {service.name}
                        </TableCell>
                        <TableCell>
                          {number.format(service.contractors)}
                        </TableCell>
                        <TableCell>{number.format(service.experts)}</TableCell>
                        <TableCell>{number.format(service.tenders)}</TableCell>
                        <TableCell>{number.format(service.cases)}</TableCell>
                        <TableCell>
                          {service.averageBudget
                            ? money.format(service.averageBudget)
                            : "Недостаточно данных"}
                        </TableCell>
                        <TableCell>
                          {service.averageDuration
                            ? `${Math.round(service.averageDuration)} дн.`
                            : "Недостаточно данных"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  description="Данные появятся после заполнения справочника услуг."
                  icon={BarChart3}
                  title="Справочник услуг пока пуст"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="demand">
          <div className="grid gap-6 lg:grid-cols-2">
            <Ranking
              items={insights.services.slice(0, 10).map((service) => ({
                name: service.name,
                count: service.demandScore,
              }))}
              title="Востребованность услуг"
              unit="сигналов"
            />
            <Ranking
              items={insights.categories}
              title="Категории контента"
              unit="упоминаний"
            />
          </div>
        </TabsContent>
        <TabsContent value="contractors">
          <Ranking
            items={insights.contractorSizes}
            title="Размер команд подрядчиков"
            unit="компаний"
          />
        </TabsContent>
        <TabsContent value="experts">
          <Ranking
            items={insights.expertSpecializations}
            title="Специализации экспертов"
            unit="экспертов"
          />
        </TabsContent>
        <TabsContent value="research">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader>
                <CardTitle>Исследования SRCHR</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p>
                  Раздел собирает обезличенные агрегаты из задач, профилей,
                  кейсов, статей и поведения пользователей.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Бюджеты",
                    "Сроки",
                    "Спрос",
                    "Специализации",
                    "Динамика",
                  ].map((item) => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Ranking items={insights.materialTypes} title="Материалы" unit="" />
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}

function Ranking({
  title,
  items,
  unit,
}: {
  title: string
  items: Array<{ name: string; count: number }>
  unit: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div>
            {items.map((item, index) => (
              <div
                className="grid grid-cols-[32px_1fr_auto] items-center gap-3 border-b py-3 last:border-0"
                key={item.name}
              >
                <span className="text-sm text-muted-foreground">
                  {index + 1}
                </span>
                <span className="font-medium">{item.name}</span>
                <span className="text-sm text-muted-foreground">
                  {number.format(item.count)} {unit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Показатели появятся по мере накопления данных."
            icon={BarChart3}
            title="Данных пока недостаточно"
          />
        )}
      </CardContent>
    </Card>
  )
}
