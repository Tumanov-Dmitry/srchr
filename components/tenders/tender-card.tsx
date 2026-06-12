import Link from "next/link"
import { ArrowUpRight, CalendarDays } from "lucide-react"

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
    <Card className="group flex h-full flex-col shadow-elevation-1 transition-colors hover:border-primary/40">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge>{budget}</Badge>
          {tender.status ? (
            <Badge variant="outline">{tender.status}</Badge>
          ) : null}
        </div>
        <CardTitle className="text-xl leading-snug">{tender.title}</CardTitle>
        <CardDescription className="line-clamp-3 min-h-[4.5rem] leading-6">
          {tender.description ?? "Описание задачи скоро появится."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end gap-3 text-sm text-muted-foreground">
        <div>{tender.organizations?.name ?? "Компания не указана"}</div>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4" />
          {formatDate(tender.deadline)}
        </div>
        <PublicViewCount views={views} />
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild className="w-full justify-between" variant="ghost">
          <Link href={`/tenders/${tender.slug}`}>
            Подробнее
            <ArrowUpRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
