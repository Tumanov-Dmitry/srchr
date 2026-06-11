import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Eye,
  FileText,
  Users,
} from "lucide-react"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMarketInsights } from "@/lib/supabase/insights-queries"

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
        title="Аналитика рынка"
        description="Агрегированные данные SRCHR по услугам, участникам рынка, задачам и публикациям. Показатели обновляются по мере накопления данных."
      />

      <section className="mb-8 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-5">
        {totals.map((item) => (
          <div className="bg-background p-5" key={item.label}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {number.format(item.value)}
            </div>
          </div>
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
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="pb-3 font-medium">Услуга</th>
                      <th className="pb-3 font-medium">Подрядчики</th>
                      <th className="pb-3 font-medium">Эксперты</th>
                      <th className="pb-3 font-medium">Задачи</th>
                      <th className="pb-3 font-medium">Кейсы</th>
                      <th className="pb-3 font-medium">Средний бюджет</th>
                      <th className="pb-3 font-medium">Средний срок</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.services.map((service) => (
                      <tr className="border-b last:border-0" key={service.id}>
                        <td className="py-4 font-medium">{service.name}</td>
                        <td className="py-4">
                          {number.format(service.contractors)}
                        </td>
                        <td className="py-4">
                          {number.format(service.experts)}
                        </td>
                        <td className="py-4">
                          {number.format(service.tenders)}
                        </td>
                        <td className="py-4">{number.format(service.cases)}</td>
                        <td className="py-4">
                          {service.averageBudget
                            ? money.format(service.averageBudget)
                            : "Накапливаем данные"}
                        </td>
                        <td className="py-4">
                          {service.averageDuration
                            ? `${Math.round(service.averageDuration)} дн.`
                            : "Накапливаем данные"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState text="Справочник услуг пока пуст." />
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
              title="Категории контента и экспертизы"
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
                  кейсов, статей и поведения пользователей. По мере роста
                  выборки здесь появятся регулярные исследования рынка.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Бюджеты</Badge>
                  <Badge variant="outline">Сроки</Badge>
                  <Badge variant="outline">Спрос</Badge>
                  <Badge variant="outline">Специализации</Badge>
                  <Badge variant="outline">Динамика рынка</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Материалы
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.materialTypes.map((item) => (
                  <div
                    className="flex items-center justify-between border-b py-3 last:border-0"
                    key={item.name}
                  >
                    <span>{item.name}</span>
                    <span className="font-medium">
                      {number.format(item.count)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
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
          <EmptyState text="Данных пока недостаточно." />
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>
  )
}
