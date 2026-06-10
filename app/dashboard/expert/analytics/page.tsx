import { redirect } from "next/navigation"
import { AnalyticsOverview } from "@/components/analytics/analytics-overview"
import {
  getExpertAnalytics,
  getExpertName,
  normalizeAnalyticsPeriod,
} from "@/lib/supabase/analytics-queries"

export default async function ExpertAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: rawPeriod } = await searchParams
  const period = normalizeAnalyticsPeriod(rawPeriod)
  const { user, profile, report } = await getExpertAnalytics(period)

  if (!user) redirect("/login")
  if (!profile) redirect("/dashboard/expert")

  return (
    <AnalyticsOverview
      basePath="/dashboard/expert/analytics"
      description={`Публичный профиль: ${getExpertName(profile)}`}
      period={period}
      report={report}
      title="Аналитика эксперта"
    />
  )
}
