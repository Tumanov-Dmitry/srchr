import type { ReactNode } from "react"
import { SlidersHorizontal } from "@/components/ui/icons"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type FilterBarProps = {
  children: ReactNode
  activeCount?: number
  className?: string
}

export function FilterBar({
  children,
  activeCount = 0,
  className,
}: FilterBarProps) {
  return (
    <Card className={cn("shadow-none", className)}>
      <CardContent className="flex flex-wrap items-center gap-3 p-3">
        <span className="flex items-center gap-2 px-2 text-sm font-medium">
          <SlidersHorizontal className="size-4" />
          Фильтры
          {activeCount > 0 ? (
            <Badge className="min-w-5 justify-center rounded-full px-1.5">
              {activeCount}
            </Badge>
          ) : null}
        </span>
        {children}
      </CardContent>
    </Card>
  )
}
