import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusTone = "neutral" | "success" | "warning" | "danger" | "accent"

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-border bg-muted text-foreground",
  success: "border-primary/20 bg-primary/10 text-primary",
  warning: "border-srchr-yellow/50 bg-srchr-yellow/20 text-foreground",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
  accent: "border-srchr-pink/40 bg-srchr-pink/20 text-foreground",
}

type StatusBadgeProps = {
  children: React.ReactNode
  tone?: StatusTone
  className?: string
}

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-1 font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </Badge>
  )
}
