import { BarChart3, Sparkles } from "@/components/ui/icons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PriceRequestInsights } from "@/types"

const confidenceLabels = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
}

function money(value: number | null) {
  return value === null
    ? "Недостаточно данных"
    : new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(value)
}

export function PriceRequestInsightsCard({
  insights,
}: {
  insights: PriceRequestInsights
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            SRCHR Insights
          </CardTitle>
          <Badge variant="secondary">
            Точность: {confidenceLabels[insights.confidence]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Средняя оценка" value={money(insights.averageCost)} />
        <Metric label="Медиана" value={money(insights.medianCost)} />
        <Metric
          label="Диапазон"
          value={
            insights.minCost === null
              ? "Недостаточно данных"
              : `${money(insights.minCost)} — ${money(insights.maxCost)}`
          }
        />
        <Metric
          label="Средний срок"
          value={
            insights.averageDurationDays === null
              ? "Недостаточно данных"
              : `${insights.averageDurationDays} дней`
          }
        />
        <Metric label="Похожих оценок" value={String(insights.samples)} />
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4">
          <BarChart3 className="size-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Расчет анонимный и уточняется по мере появления новых оценок.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  )
}
