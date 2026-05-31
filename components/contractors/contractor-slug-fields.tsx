"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RequiredLabel } from "@/components/ui/required-label"
import { createSlug } from "@/lib/slug"

export function ContractorSlugFields({
  defaultName,
  defaultSlug,
  defaultWebsite,
}: {
  defaultName: string
  defaultSlug?: string | null
  defaultWebsite?: string | null
}) {
  const [name, setName] = useState(defaultName)
  const [website, setWebsite] = useState(defaultWebsite ?? "")
  const [slug, setSlug] = useState(defaultSlug ?? createSlug(defaultName))
  const [isSlugEdited, setIsSlugEdited] = useState(Boolean(defaultSlug))

  const generatedSlug = useMemo(
    () => createSlug(website || name),
    [name, website],
  )

  return (
    <>
      <div className="space-y-2">
        <RequiredLabel htmlFor="name" required>Название</RequiredLabel>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => {
            const nextName = event.target.value
            setName(nextName)

            if (!isSlugEdited) {
              setSlug(createSlug(website || nextName))
            }
          }}
          required
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="website_url">Сайт</Label>
        <Input
          id="website_url"
          name="website_url"
          value={website}
          placeholder="https://example.com"
          onChange={(event) => {
            const nextWebsite = event.target.value
            setWebsite(nextWebsite)

            if (!isSlugEdited) {
              setSlug(createSlug(nextWebsite || name))
            }
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Публичный адрес</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          placeholder={generatedSlug}
          onChange={(event) => {
            setIsSlugEdited(true)
            setSlug(createSlug(event.target.value))
          }}
        />
        <p className="text-sm text-muted-foreground">
          Автоматически создаётся из названия, но его можно отредактировать.
          Ссылка: /contractors/{slug || generatedSlug}
        </p>
      </div>
    </>
  )
}
