import Link from "next/link"
import { ArrowRight, CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CompletionScore } from "@/types"

export function CompletionBanner({
  title,
  score,
  href,
}: {
  title: string
  score: CompletionScore
  href: string
}) {
  if (score.percent >= 100) return null

  return (
    <div className="mb-6 rounded-md border border-primary/25 bg-primary/5 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 font-medium">
            <CircleAlert className="h-4 w-4 text-primary" />
            {title}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-[width]"
              style={{ width: `${score.percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Заполнено на {score.percent}%
            {score.missing.length > 0
              ? ` · добавьте: ${score.missing.slice(0, 3).join(", ")}`
              : ""}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={href}>
            Продолжить <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
