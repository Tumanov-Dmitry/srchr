import { ArrowUpRight } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

type CaseCardProps = {
  title: string
  author: string
  coverUrl?: string
  authorAvatarUrl?: string
  category?: string
  result?: string
}

export function CaseCard({
  title,
  author,
  coverUrl,
  authorAvatarUrl,
  category,
  result,
}: CaseCardProps) {
  return (
    <Card className="group overflow-hidden shadow-elevation-1">
      <div className="aspect-[16/10] overflow-hidden bg-muted">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full place-items-center bg-srchr-pink/20 text-sm text-muted-foreground">
            Обложка кейса
          </div>
        )}
      </div>
      <CardContent className="space-y-4 pt-6">
        {category ? <Badge variant="secondary">{category}</Badge> : null}
        <h3 className="text-xl font-semibold leading-snug">{title}</h3>
        {result ? (
          <p className="text-sm text-muted-foreground">{result}</p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <Avatar className="size-7">
            <AvatarImage src={authorAvatarUrl} alt={author} />
            <AvatarFallback>{author.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="truncate">{author}</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Открыть кейс ${title}`}
        >
          <ArrowUpRight />
        </Button>
      </CardFooter>
    </Card>
  )
}
