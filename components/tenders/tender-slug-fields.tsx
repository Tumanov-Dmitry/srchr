"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSlug } from "@/lib/slug"

export function TenderSlugFields({
  defaultTitle,
  defaultSlug,
}: {
  defaultTitle?: string | null
  defaultSlug?: string | null
}) {
  const [title, setTitle] = useState(defaultTitle ?? "")
  const [slug, setSlug] = useState(defaultSlug ?? createSlug(defaultTitle ?? ""))
  const [isSlugEdited, setIsSlugEdited] = useState(Boolean(defaultSlug))

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Название задачи</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(event) => {
            const nextTitle = event.target.value
            setTitle(nextTitle)
            if (!isSlugEdited) {
              setSlug(createSlug(nextTitle))
            }
          }}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Публичный адрес</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => {
            setIsSlugEdited(true)
            setSlug(createSlug(event.target.value))
          }}
          placeholder="new-website-design"
        />
        <p className="text-sm text-muted-foreground">
          Ссылка задачи: /tenders/{slug || createSlug(title)}
        </p>
      </div>
    </>
  )
}
