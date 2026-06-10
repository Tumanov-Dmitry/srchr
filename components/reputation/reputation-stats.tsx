"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Award, MessageSquareText, ThumbsUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const [isOpen, setIsOpen] = useState(false)
  const values = summary ?? emptySummary

  useEffect(() => {
    if (!isOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }

    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [isOpen])

  const content = (
    <>
      <span className="flex items-center gap-1.5 font-medium text-foreground">
        <Award className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        Репутация: {values.total_points.toLocaleString("ru-RU")}
      </span>
      <span className="flex items-center gap-1.5">
        <MessageSquareText className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {values.reviews_count.toLocaleString("ru-RU")} отзывов
      </span>
      <span className="flex items-center gap-1.5">
        <ThumbsUp className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {values.recommendations_count.toLocaleString("ru-RU")} рекомендаций
      </span>
    </>
  )

  const sharedClassName = cn(
    "relative flex flex-wrap items-center gap-x-4 gap-y-2 text-left text-sm",
    compact ? "text-xs text-muted-foreground" : "text-muted-foreground",
    (href || details) &&
      "group rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
    className,
  )

  return (
    <>
      {href ? (
        <Link className={sharedClassName} href={href}>
          {content}
          <ReputationTooltip />
        </Link>
      ) : details ? (
        <button
          className={sharedClassName}
          onClick={() => setIsOpen(true)}
          type="button"
        >
          {content}
          <ReputationTooltip />
        </button>
      ) : (
        <div className={sharedClassName}>{content}</div>
      )}

      {details && isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setIsOpen(false)
          }}
          role="dialog"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-background shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h2 className="text-xl font-semibold">Репутация</h2>
                <p className="mt-1 text-3xl font-semibold">
                  {values.total_points.toLocaleString("ru-RU")}
                </p>
              </div>
              <Button
                aria-label="Закрыть"
                onClick={() => setIsOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5">
              <p className="mb-4 text-sm text-muted-foreground">Получено за:</p>
              <div className="divide-y rounded-md border">
                {reputationCategoryOrder.map((category) => {
                  const row = breakdown.find(
                    (item) => item.category === category,
                  )

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
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>{values.reviews_count} отзывов</span>
                <span>{values.recommendations_count} рекомендаций</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function ReputationTooltip() {
  return (
    <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-72 rounded-md border bg-popover p-3 text-xs font-normal leading-5 text-popover-foreground shadow-md group-hover:block group-focus-visible:block">
      <span className="mb-1 block font-medium">Репутация складывается из:</span>
      <span className="block">• кейсов и статей</span>
      <span className="block">• отзывов клиентов</span>
      <span className="block">• рекомендаций участников</span>
      <span className="block">• выполненных заданий</span>
      <span className="block">• активности на платформе</span>
    </span>
  )
}
