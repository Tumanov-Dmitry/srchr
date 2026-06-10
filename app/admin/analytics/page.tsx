import { AnalyticsOverview } from "@/components/analytics/analytics-overview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getAdminAnalytics,
  normalizeAnalyticsPeriod,
} from "@/lib/supabase/analytics-queries"

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: rawPeriod } = await searchParams
  const period = normalizeAnalyticsPeriod(rawPeriod)
  const { report, topTargets } = await getAdminAnalytics(period)

  return (
    <div className="space-y-6">
      <AnalyticsOverview
        basePath="/admin/analytics"
        description="Сводные продуктовые показатели платформы"
        period={period}
        report={report}
        title="Аналитика SRCHR"
      />
      <Card>
        <CardHeader>
          <CardTitle>Самые просматриваемые объекты</CardTitle>
        </CardHeader>
        <CardContent>
          {topTargets.length > 0 ? (
            <div className="divide-y">
              {topTargets.map((target) => (
                <div
                  className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_120px_120px_120px]"
                  key={`${target.targetType}:${target.targetId}`}
                >
                  <span className="truncate">
                    {target.targetType} · {target.targetId}
                  </span>
                  <span>{target.views} просмотров</span>
                  <span>{target.favorites} избранных</span>
                  <span>{target.responses} откликов</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Статистика объектов пока не накоплена.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
