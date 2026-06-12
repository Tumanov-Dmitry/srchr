"use client"

import Link from "next/link"
import { Award, MessageSquareText, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  reputationCategoryLabels,
  reputationCategoryOrder,
} from "@/lib/reputation"
import { cn } from "@/lib/utils"
import type { ReputationBreakdown, ReputationSummary } from "@/types"

const emptySummary: Pick<
  ReputationSummary,
  "total_points" | "reviews_count" | "recommendations_count"
> = {
  total_points: 0,
  reviews_count: 0,
  recommendations_count: 0,
}

export function ReputationStats({
  summary,
  breakdown = [],
  compact = false,
  className,
  href,
  details = false,
}: {
  summary?: ReputationSummary | null
  breakdown?: ReputationBreakdown[]
  compact?: boolean
  className?: string
  href?: string
  details?: boolean
}) {
  const values = summary ?? emptySummary
  const content = (
    <>
      <span className="flex items-center gap-1.5 font-medium text-foreground">
        <Award className={compact ? "size-3.5" : "size-4"} />
        Репутация: {values.total_points.toLocaleString("ru-RU")}
      </span>
      <span className="flex items-center gap-1.5">
        <MessageSquareText className={compact ? "size-3.5" : "size-4"} />
        {values.reviews_count.toLocaleString("ru-RU")} отзывов
      </span>
      <span className="flex items-center gap-1.5">
        <ThumbsUp className={compact ? "size-3.5" : "size-4"} />
        {values.recommendations_count.toLocaleString("ru-RU")} рекомендаций
      </span>
    </>
  )
  const sharedClassName = cn(
    "flex flex-wrap items-center gap-x-4 gap-y-2 text-left text-sm",
    compact ? "text-xs text-muted-foreground" : "text-muted-foreground",
    className,
  )

  const trigger = href ? (
    <Link className={sharedClassName} href={href}>
      {content}
    </Link>
  ) : details ? (
    <Button
      className={cn("h-auto justify-start p-0", sharedClassName)}
      variant="link"
    >
      {content}
    </Button>
  ) : (
    <div className={sharedClassName}>{content}</div>
  )

  if (!details) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent className="max-w-72">
          Репутация складывается из кейсов, статей, отзывов, рекомендаций,
          заданий и активности.
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Dialog>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        </DialogTrigger>
        <TooltipContent>Открыть расшифровку репутации</TooltipContent>
      </Tooltip>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Репутация</DialogTitle>
          <DialogDescription>
            {values.total_points.toLocaleString("ru-RU")} баллов
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y rounded-lg border">
          {reputationCategoryOrder.map((category) => {
            const row = breakdown.find((item) => item.category === category)
            return (
              <div
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                key={category}
              >
                <span>{reputationCategoryLabels[category]}</span>
                <span className="font-medium">
                  {(row?.total_points ?? 0).toLocaleString("ru-RU")}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{values.reviews_count} отзывов</span>
          <span>{values.recommendations_count} рекомендаций</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
