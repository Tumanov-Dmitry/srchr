"use client"

import Link from "next/link"
import { Folder, Pencil, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { FavoriteCollection } from "@/types"

export function FavoriteCollectionsPanel({
  initialCollections,
  activeCollectionId,
}: {
  initialCollections: FavoriteCollection[]
  activeCollectionId?: string | null
}) {
  const router = useRouter()
  const [collections, setCollections] = useState(initialCollections)
  const [name, setName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function createCollection() {
    const nextName = name.trim()
    if (!nextName) return
    setMessage(null)

    startTransition(async () => {
      const response = await fetch("/api/favorite-collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setMessage(result?.error ?? "Не удалось создать коллекцию")
        return
      }
      setCollections((current) => [result.collection, ...current])
      setName("")
      router.refresh()
    })
  }

  function saveCollection(collection: FavoriteCollection) {
    const nextName = editingName.trim()
    if (!nextName) return

    startTransition(async () => {
      const response = await fetch(
        `/api/favorite-collections/${collection.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nextName,
            description: collection.description,
            icon: collection.icon,
            color: collection.color,
          }),
        },
      )
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setMessage(result?.error ?? "Не удалось переименовать коллекцию")
        return
      }
      setCollections((current) =>
        current.map((item) =>
          item.id === collection.id ? { ...item, name: nextName } : item,
        ),
      )
      setEditingId(null)
      router.refresh()
    })
  }

  function deleteCollection(collectionId: string) {
    startTransition(async () => {
      const response = await fetch(
        `/api/favorite-collections/${collectionId}`,
        { method: "DELETE" },
      )
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setMessage(result?.error ?? "Не удалось удалить коллекцию")
        return
      }
      setCollections((current) =>
        current.filter((collection) => collection.id !== collectionId),
      )
      if (activeCollectionId === collectionId) {
        router.push("/dashboard/favorites?view=collections")
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Новая коллекция</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, потенциальные подрядчики"
            value={name}
          />
          <Button
            disabled={isPending || !name.trim()}
            onClick={createCollection}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Создать
          </Button>
        </CardContent>
      </Card>

      {collections.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <Card
              className={
                activeCollectionId === collection.id ? "border-primary" : ""
              }
              key={collection.id}
            >
              <CardContent className="space-y-3 p-4">
                {editingId === collection.id ? (
                  <div className="flex gap-2">
                    <Input
                      onChange={(event) => setEditingName(event.target.value)}
                      value={editingName}
                    />
                    <Button
                      onClick={() => saveCollection(collection)}
                      size="sm"
                      type="button"
                    >
                      OK
                    </Button>
                  </div>
                ) : (
                  <Link
                    className="block"
                    href={`/dashboard/favorites?view=collections&collection=${collection.id}`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Folder className="h-4 w-4 text-primary" />
                      {collection.name}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {collection.items_count ?? 0} объектов
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Обновлено{" "}
                      {new Date(collection.updated_at).toLocaleDateString(
                        "ru-RU",
                      )}
                    </p>
                  </Link>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setEditingId(collection.id)
                      setEditingName(collection.name)
                    }}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    disabled={isPending}
                    onClick={() => deleteCollection(collection.id)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          Коллекций пока нет.
        </p>
      )}

      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  )
}
