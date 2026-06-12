import { ArrowUpRight, MessageSquareText, WalletCards } from "@/components/ui/icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/srchr/status-badge"

type ProjectCardProps = {
  title: string
  company?: string
  budget: string
  responses?: number
  status?: string
  tags?: string[]
}

export function ProjectCard({
  title,
  company,
  budget,
  responses = 0,
  status = "Открыт",
  tags = [],
}: ProjectCardProps) {
  return (
    <Card className="flex h-full flex-col shadow-elevation-1">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-4">
          <StatusBadge tone="success">{status}</StatusBadge>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Открыть проект ${title}`}
          >
            <ArrowUpRight />
          </Button>
        </div>
        <div>
          <h3 className="text-xl font-semibold leading-snug">{title}</h3>
          {company ? (
            <p className="mt-2 text-sm text-muted-foreground">{company}</p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-4 border-t pt-4">
        <span className="flex items-center gap-2 text-sm">
          <WalletCards className="size-4 text-muted-foreground" />
          <strong>{budget}</strong>
        </span>
        <span className="flex items-center justify-end gap-2 text-sm">
          <MessageSquareText className="size-4 text-muted-foreground" />
          {responses} откликов
        </span>
      </CardFooter>
    </Card>
  )
}
