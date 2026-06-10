import Link from "next/link"
import {
  CalendarPlus,
  Contact,
  ExternalLink,
  Eye,
  Heart,
  MousePointerClick,
  Send,
  Share2,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AnalyticsMetricKey, AnalyticsPeriod } from "@/types"
import type { AnalyticsReport } from "@/lib/supabase/analytics-queries"

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
  { key: "responses", label: "Отклики", icon: Send },
  { key: "participation_going", label: "Пойдут", icon: Users },
  {
    key: "participation_interested",
    label: "Интересно",
    icon: MousePointerClick,
  },
  { key: "calendar_adds", label: "В календарь", icon: CalendarPlus },
  { key: "shares", label: "Поделились", icon: Share2 },
]

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
  const maxValue = Math.max(...report.series.map((point) => point.value), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
          {description ? (
            <p className="mt-2 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1 rounded-md border bg-background p-1">
          {periods.map((item) => (
            <Link
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors",
                period === item.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              href={`${basePath}?period=${item.value}`}
              key={item.value}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {report.isMissing ? (
        <Card>
          <CardHeader>
            <CardTitle>Нужен модуль аналитики</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Примените SQL из `supabase/sql/create-analytics.sql`.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {visibleMetrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card key={metric.key}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">
                  {(report.totals[metric.key] ?? 0).toLocaleString("ru-RU")}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Динамика просмотров</CardTitle>
        </CardHeader>
        <CardContent>
          {report.series.length > 0 ? (
            <div className="flex h-52 items-end gap-1 overflow-hidden border-b border-l px-2 pt-4">
              {report.series.map((point) => (
                <div
                  className="group relative flex min-w-2 flex-1 items-end"
                  key={point.date}
                  title={`${point.date}: ${point.value}`}
                >
                  <div
                    className="w-full min-w-2 bg-primary transition-colors group-hover:bg-primary/80"
                    style={{
                      height: `${Math.max((point.value / maxValue) * 100, 4)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Данные появятся после первых просмотров.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
