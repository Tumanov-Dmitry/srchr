import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SectionCardProps = {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn("border-border/90 shadow-elevation-1", className)}>
      {title || description || actions ? (
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            {title ? <CardTitle className="type-h3">{title}</CardTitle> : null}
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          {actions}
        </CardHeader>
      ) : null}
      <CardContent
        className={title || description || actions ? undefined : "pt-6"}
      >
        {children}
      </CardContent>
    </Card>
  )
}
