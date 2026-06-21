"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  materialReactionOptions,
  type MaterialEngagementState,
  type MaterialReactionKey,
} from "@/lib/material-engagement"
import { cn } from "@/lib/utils"

type MaterialEngagementProps = MaterialEngagementState & {
  materialId: string
  audienceQuestion?: string | null
}

export function MaterialEngagement({
  materialId,
  comments,
  reactionCounts: initialCounts,
  currentReaction: initialReaction,
  isAuthenticated,
  isAvailable,
  audienceQuestion,
}: MaterialEngagementProps) {
  const router = useRouter()
  const [body, setBody] = useState("")
  const [reactionCounts, setReactionCounts] = useState(initialCounts)
  const [currentReaction, setCurrentReaction] = useState(initialReaction)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function react(reaction: MaterialReactionKey) {
    if (!isAuthenticated) return
    const previous = currentReaction
    const previousCounts = reactionCounts
    const next = previous === reaction ? null : reaction
    setCurrentReaction(next)
    setReactionCounts((counts) => ({
      ...counts,
      ...(previous ? { [previous]: Math.max(0, counts[previous] - 1) } : {}),
      ...(next ? { [next]: counts[next] + 1 } : {}),
    }))

    const response = await fetch(`/api/materials/${materialId}/reactions`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reaction }),
    })
    if (!response.ok) {
      setCurrentReaction(previous)
      setReactionCounts(previousCounts)
      setError("Не удалось сохранить реакцию")
    }
  }

  async function submitComment() {
    if (!body.trim() || pending) return
    setPending(true)
    setError(null)
    const response = await fetch(`/api/materials/${materialId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    })
    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      setError(result.error ?? "Не удалось добавить комментарий")
    } else {
      setBody("")
      router.refresh()
    }
    setPending(false)
  }

  if (!isAvailable) {
    return (
      <Card className="mt-12">
        <CardContent className="py-6 text-sm text-muted-foreground">
          Комментарии и реакции станут доступны после применения SQL-патча.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mt-12 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Реакции</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {materialReactionOptions.map((option) => (
              <Button
                className={cn(
                  "gap-2",
                  currentReaction === option.key &&
                    "border-primary bg-primary/10",
                )}
                disabled={!isAuthenticated}
                key={option.key}
                onClick={() => void react(option.key)}
                title={
                  isAuthenticated
                    ? option.label
                    : "Войдите, чтобы поставить реакцию"
                }
                type="button"
                variant="outline"
              >
                <span aria-hidden>{option.emoji}</span>
                <span>{reactionCounts[option.key]}</span>
              </Button>
            ))}
          </div>
          {!isAuthenticated ? (
            <p className="mt-4 text-sm text-muted-foreground">
              <Link className="text-primary hover:underline" href="/login">
                Войдите
              </Link>
              , чтобы поставить реакцию.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Комментарии</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {audienceQuestion ? (
            <p className="rounded-lg bg-muted p-4 font-medium">
              {audienceQuestion}
            </p>
          ) : null}
          {isAuthenticated ? (
            <div className="space-y-3">
              <Textarea
                maxLength={2000}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Напишите комментарий"
                value={body}
              />
              <div className="flex justify-end">
                <Button
                  disabled={!body.trim() || pending}
                  onClick={() => void submitComment()}
                  type="button"
                >
                  {pending ? "Отправляем..." : "Отправить"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link className="text-primary hover:underline" href="/login">
                Войдите
              </Link>
              , чтобы участвовать в обсуждении.
            </p>
          )}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="space-y-5">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Комментариев пока нет.
              </p>
            ) : null}
            {comments.map((comment) => (
              <div
                className="flex gap-3 border-t pt-5 first:border-0 first:pt-0"
                key={comment.id}
              >
                <Avatar className="size-9">
                  <AvatarImage
                    alt=""
                    src={comment.author.avatar_url ?? undefined}
                  />
                  <AvatarFallback>
                    {comment.author.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">{comment.author.name}</p>
                    <time className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("ru-RU", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(comment.created_at))}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {comment.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
