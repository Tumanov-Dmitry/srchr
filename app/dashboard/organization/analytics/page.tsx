import { redirect } from "next/navigation"
import { AnalyticsOverview } from "@/components/analytics/analytics-overview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getOrganizationAnalytics,
  normalizeAnalyticsPeriod,
} from "@/lib/supabase/analytics-queries"

export default async function OrganizationAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: rawPeriod } = await searchParams
  const period = normalizeAnalyticsPeriod(rawPeriod)
  const { user, reports } = await getOrganizationAnalytics(period)

  if (!user) redirect("/login")
  if (reports.length === 0) redirect("/dashboard/organization")

  return (
    <Tabs defaultValue={reports[0].owner.id}>
      {reports.length > 1 ? (
        <TabsList className="mb-6 h-auto flex-wrap justify-start">
          {reports.map(({ owner }) => (
            <TabsTrigger key={owner.id} value={owner.id}>
              {owner.name}
            </TabsTrigger>
          ))}
        </TabsList>
      ) : null}
      {reports.map(({ owner, report }) => (
        <TabsContent key={owner.id} value={owner.id}>
          <AnalyticsOverview
            basePath="/dashboard/organization/analytics"
            description={owner.name}
            period={period}
            report={report}
            title="Аналитика организации"
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
