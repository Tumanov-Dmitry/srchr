import type { LucideIcon } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed bg-card/60 shadow-none">
      <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
        <span className="mb-5 grid size-12 place-items-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </span>
        <h3 className="type-h3">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        {actionLabel ? (
          <Button className="mt-6" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
