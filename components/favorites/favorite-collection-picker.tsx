"use client"

import { FolderPlus, Plus, X } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FavoriteCollection } from "@/types"

export function FavoriteCollectionPicker({
  favoriteId,
  initialCollectionIds = [],
  initiallyOpen = false,
}: {
  favoriteId: string
  initialCollectionIds?: string[]
  initiallyOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const [collections, setCollections] = useState<FavoriteCollection[]>([])
  const [selectedIds, setSelectedIds] = useState(initialCollectionIds)
  const [newName, setNewName] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isOpen || collections.length > 0) return

    fetch("/api/favorite-collections")
      .then((response) => response.json())
      .then((result) => setCollections(result.collections ?? []))
      .catch(() => setMessage("Не удалось загрузить коллекции"))
  }, [collections.length, isOpen])

  function toggleCollection(collectionId: string) {
    const isSelected = selectedIds.includes(collectionId)
    setMessage(null)

    startTransition(async () => {
      const response = await fetch(
        `/api/favorite-collections/${collectionId}/items${
          isSelected ? `?favorite_id=${favoriteId}` : ""
        }`,
        {
          method: isSelected ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: isSelected
            ? undefined
            : JSON.stringify({ favorite_id: favoriteId }),
        },
      )
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setMessage(result?.error ?? "Не удалось обновить коллекцию")
        return
      }

      setSelectedIds((current) =>
        isSelected
          ? current.filter((id) => id !== collectionId)
          : [...current, collectionId],
      )
    })
  }

  function createCollection() {
    const name = newName.trim()
    if (!name) return
    setMessage(null)

    startTransition(async () => {
      const response = await fetch("/api/favorite-collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setMessage(result?.error ?? "Не удалось создать коллекцию")
        return
      }

      const collection = result.collection as FavoriteCollection
      setCollections((current) => [collection, ...current])
      setNewName("")
      toggleCollection(collection.id)
    })
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => setIsOpen((value) => !value)}
        size="sm"
        type="button"
        variant="outline"
      >
        <FolderPlus className="h-4 w-4" />
        Коллекции
      </Button>

      {isOpen ? (
        <div className="min-w-64 space-y-3 rounded-md border bg-background p-3">
          <div className="flex gap-2">
            <Input
              aria-label="Название новой коллекции"
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Новая коллекция"
              value={newName}
            />
            <Button
              disabled={isPending || !newName.trim()}
              onClick={createCollection}
              size="icon"
              type="button"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {collections.length > 0 ? (
            <div className="grid gap-1">
              {collections.map((collection) => {
                const isSelected = selectedIds.includes(collection.id)
                return (
                  <Button
                    className="justify-between"
                    disabled={isPending}
                    key={collection.id}
                    onClick={() => toggleCollection(collection.id)}
                    size="sm"
                    type="button"
                    variant={isSelected ? "secondary" : "ghost"}
                  >
                    <span className="truncate">{collection.name}</span>
                    {isSelected ? <X className="h-3.5 w-3.5" /> : null}
                  </Button>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Создайте первую коллекцию для этой карточки.
            </p>
          )}

          {message ? (
            <p className="text-xs text-destructive">{message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
