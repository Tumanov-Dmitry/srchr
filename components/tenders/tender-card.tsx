import Link from "next/link"
import { CalendarDays } from "lucide-react"
import { PublicViewCount } from "@/components/analytics/public-view-count"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDate, formatMoney } from "@/lib/utils"
import type { Tender } from "@/types"

export function TenderCard({
  tender,
  views,
}: {
  tender: Tender
  views?: number
}) {
  const budget = tender.budget_from
    ? tender.budget_to
      ? `${formatMoney(tender.budget_from)} - ${formatMoney(tender.budget_to)}`
      : `от ${formatMoney(tender.budget_from)}`
    : tender.budget_to
      ? `до ${formatMoney(tender.budget_to)}`
      : formatMoney(tender.budget)

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge className="w-fit">{budget}</Badge>
          {tender.status ? (
            <Badge variant="outline">{tender.status}</Badge>
          ) : null}
        </div>
        <CardTitle>{tender.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {tender.description ?? "Описание задачи скоро появится."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end gap-2 text-sm text-muted-foreground">
        <div>{tender.organizations?.name ?? "Компания не указана"}</div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {formatDate(tender.deadline)}
        </div>
        <PublicViewCount views={views} />
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/tenders/${tender.slug}`}>Подробнее</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
