import { notFound, redirect } from "next/navigation"
import { AnalyticsOverview } from "@/components/analytics/analytics-overview"
import {
  getManagedTargetAnalytics,
  normalizeAnalyticsPeriod,
} from "@/lib/supabase/analytics-queries"

export default async function EventAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const [{ id }, { period: rawPeriod }] = await Promise.all([
    params,
    searchParams,
  ])
  const period = normalizeAnalyticsPeriod(rawPeriod)
  const { user, target, report } = await getManagedTargetAnalytics(
    "event",
    id,
    period,
  )

  if (!user) redirect("/login")
  if (!target) notFound()

  return (
    <AnalyticsOverview
      basePath={`/dashboard/analytics/events/${id}`}
      description={target.title}
      period={period}
      report={report}
      title="Аналитика мероприятия"
    />
  )
}
