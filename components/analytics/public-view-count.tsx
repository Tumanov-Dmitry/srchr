import { Eye } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

export function PublicViewCount({
  views,
  className,
}: {
  views?: number | null
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground",
        className,
      )}
      title="Количество просмотров"
    >
      <Eye className="h-4 w-4" />
      {new Intl.NumberFormat("ru-RU").format(views ?? 0)}
    </span>
  )
}
