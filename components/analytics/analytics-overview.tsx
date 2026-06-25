"use client"

import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  CalendarPlus,
  CircleAlert,
  Contact,
  ExternalLink,
  Eye,
  Heart,
  MousePointerClick,
  Send,
  Share2,
  Users,
} from "@/components/ui/icons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { AnalyticsReport } from "@/lib/supabase/analytics-queries"
import type { AnalyticsMetricKey, AnalyticsPeriod } from "@/types"

const periods: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "7", label: "7 дней" },
  { value: "30", label: "30 дней" },
  { value: "90", label: "90 дней" },
  { value: "all", label: "Всё время" },
]

const metrics: Array<{
  key: AnalyticsMetricKey
  label: string
  icon: typeof Eye
}> = [
  { key: "views", label: "Просмотры", icon: Eye },
  { key: "unique_views", label: "Уникальные", icon: Users },
  { key: "favorites", label: "В избранное", icon: Heart },
  { key: "contact_clicks", label: "Контакты", icon: Contact },
  { key: "external_clicks", label: "Внешние ссылки", icon: ExternalLink },
  { key: "author_clicks", label: "Переходы к автору", icon: MousePointerClick },
  {
    key: "organization_clicks",
    label: "Переходы к компании",
    icon: MousePointerClick,
  },
  { key: "responses", label: "Отклики", icon: Send },
  {
    key: "response_status_changes",
    label: "Статусы откликов",
    icon: MousePointerClick,
  },
  { key: "saves", label: "Сохранения", icon: Heart },
  { key: "participation_going", label: "Пойдут", icon: Users },
  {
    key: "participation_interested",
    label: "Интересно",
    icon: MousePointerClick,
  },
  {
    key: "registration_clicks",
    label: "Переходы на регистрацию",
    icon: ExternalLink,
  },
  { key: "calendar_adds", label: "В календарь", icon: CalendarPlus },
  { key: "shares", label: "Поделились", icon: Share2 },
]

const viewsConfig = {
  value: {
    label: "Просмотры",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const activityConfig = {
  value: {
    label: "Действия",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

function shortDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`))
}

export function AnalyticsOverview({
  report,
  period,
  basePath,
  title,
  description,
}: {
  report: AnalyticsReport
  period: AnalyticsPeriod
  basePath: string
  title: string
  description?: string
}) {
  const visibleMetrics = metrics.filter(
    (metric) =>
      metric.key === "views" ||
      metric.key === "unique_views" ||
      (report.totals[metric.key] ?? 0) > 0,
  )
  const activityData = visibleMetrics
    .filter((metric) => metric.key !== "views")
    .map((metric) => ({
      name: metric.label,
      value: report.totals[metric.key] ?? 0,
    }))
    .filter((item) => item.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="type-h1">{title}</h1>
          {description ? (
            <p className="type-body mt-2 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border bg-card p-1 shadow-elevation-1">
          {periods.map((item) => (
            <Button
              asChild
              key={item.value}
              size="sm"
              variant={period === item.value ? "default" : "ghost"}
            >
              <Link href={`${basePath}?period=${item.value}`}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      {report.isMissing ? (
        <Alert>
          <CircleAlert />
          <AlertTitle>Нужен модуль аналитики</AlertTitle>
          <AlertDescription>
            Примените SQL из `supabase/sql/create-analytics.sql`.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {visibleMetrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card key={metric.key}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className="size-4" />
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tabular-nums">
                  {(report.totals[metric.key] ?? 0).toLocaleString("ru-RU")}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Динамика просмотров</CardTitle>
            <CardDescription>
              Изменение просмотров за выбранный период
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.series.length > 0 ? (
              <ChartContainer
                config={viewsConfig}
                className="h-[300px] w-full"
              >
                <AreaChart
                  accessibilityLayer
                  data={report.series}
                  margin={{ left: 0, right: 8 }}
                >
                  <defs>
                    <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-value)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-value)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    axisLine={false}
                    dataKey="date"
                    minTickGap={28}
                    tickFormatter={shortDate}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => shortDate(String(value))}
                      />
                    }
                  />
                  <Area
                    dataKey="value"
                    fill="url(#viewsFill)"
                    fillOpacity={1}
                    isAnimationActive
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="grid h-[300px] place-items-center rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
                Данные появятся после первых просмотров
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Активность</CardTitle>
            <CardDescription>Действия аудитории кроме просмотров</CardDescription>
          </CardHeader>
          <CardContent>
            {activityData.length > 0 ? (
              <ChartContainer
                config={activityConfig}
                className="h-[300px] w-full"
              >
                <BarChart
                  accessibilityLayer
                  data={activityData}
                  layout="vertical"
                  margin={{ left: 6, right: 16 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    axisLine={false}
                    dataKey="name"
                    tickLine={false}
                    type="category"
                    width={112}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel />}
                    cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    isAnimationActive
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="grid h-[300px] place-items-center rounded-xl border border-dashed bg-muted/20 text-center text-sm text-muted-foreground">
                Действия аудитории появятся здесь
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
