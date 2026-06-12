"use client"

import { Pin, PinOff, Trash2 } from "@/components/ui/icons"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { FavoriteCollectionPicker } from "@/components/favorites/favorite-collection-picker"

export function FavoriteCardActions({
  favoriteId,
  isPinned,
  collectionIds = [],
}: {
  favoriteId: string
  isPinned: boolean
  collectionIds?: string[]
}) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function run(endpoint: string, method: "PATCH" | "DELETE") {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(endpoint, { method })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setMessage(result?.error ?? "Не удалось выполнить действие")
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          disabled={isPending}
          onClick={() =>
            run(
              isPinned
                ? `/api/favorites/${favoriteId}/unpin`
                : `/api/favorites/${favoriteId}/pin`,
              "PATCH",
            )
          }
          size="sm"
          type="button"
          variant="outline"
        >
          {isPinned ? (
            <PinOff className="h-4 w-4" />
          ) : (
            <Pin className="h-4 w-4" />
          )}
          {isPinned ? "Открепить" : "Закрепить"}
        </Button>
        <Button
          disabled={isPending}
          onClick={() => run(`/api/favorites/${favoriteId}`, "DELETE")}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2 className="h-4 w-4" />
          Удалить
        </Button>
      </div>
      <FavoriteCollectionPicker
        favoriteId={favoriteId}
        initialCollectionIds={collectionIds}
      />
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  )
}
