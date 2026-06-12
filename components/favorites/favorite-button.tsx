"use client"

import { useRouter } from "next/navigation"
import { Heart } from "@/components/ui/icons"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { FavoriteTargetType } from "@/types"
import { FavoriteCollectionPicker } from "@/components/favorites/favorite-collection-picker"

type FavoriteButtonProps = {
  targetType: FavoriteTargetType
  targetId: string
  initialFavoriteId?: string | null
  label?: string
  className?: string
}

export function FavoriteButton({
  targetType,
  targetId,
  initialFavoriteId = null,
  label,
  className,
}: FavoriteButtonProps) {
  const router = useRouter()
  const [favoriteId, setFavoriteId] = useState(initialFavoriteId)
  const [message, setMessage] = useState<string | null>(null)
  const [showCollections, setShowCollections] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isFavorite = Boolean(favoriteId)

  function toggleFavorite() {
    setMessage(null)
    startTransition(async () => {
      if (favoriteId) {
        const response = await fetch(`/api/favorites/${favoriteId}`, {
          method: "DELETE",
        })
        if (!response.ok) {
          setMessage("Не удалось удалить из избранного")
          return
        }
        setFavoriteId(null)
        setShowCollections(false)
        router.refresh()
        return
      }

      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: targetType, target_id: targetId }),
      })
      const result = await response.json().catch(() => null)

      if (response.status === 401) {
        window.location.href = "/login"
        return
      }

      if (!response.ok) {
        setMessage(result?.error ?? "Не удалось добавить в избранное")
        return
      }

      setFavoriteId(result?.favorite?.id ?? null)
      setShowCollections(true)
      router.refresh()
    })
  }

  return (
    <div className={cn("space-y-1", className)}>
      <Button
        aria-pressed={isFavorite}
        aria-label={
          isFavorite ? "Удалить из избранного" : "Добавить в избранное"
        }
        disabled={isPending}
        onClick={toggleFavorite}
        size={label ? "default" : "icon"}
        type="button"
        variant={isFavorite ? "default" : "outline"}
      >
        <Heart className={cn("h-4 w-4", isFavorite ? "fill-current" : null)} />
        {label ? <span>{isFavorite ? "В избранном" : label}</span> : null}
      </Button>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
      {favoriteId && showCollections ? (
        <FavoriteCollectionPicker favoriteId={favoriteId} initiallyOpen />
      ) : null}
    </div>
  )
}
