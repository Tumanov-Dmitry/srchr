"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { MaterialContentRenderer } from "@/components/media/material-content-renderer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { MaterialDocument } from "@/lib/material-content"

type PreviewPayload = {
  title?: string
  description?: string
  coverUrl?: string
  document?: MaterialDocument
}

function isPreviewPayload(value: unknown): value is PreviewPayload {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  const document = record.document
  return (
    !document ||
    (typeof document === "object" &&
      document !== null &&
      Array.isArray((document as MaterialDocument).blocks))
  )
}

export function MaterialPreviewPageClient({ storageKey }: { storageKey: string }) {
  const [payload, setPayload] = useState<PreviewPayload | null>(null)

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isPreviewPayload(parsed)) setPayload(parsed)
    } catch {
      setPayload(null)
    }
  }, [storageKey])

  if (!payload?.document) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <h1 className="text-2xl font-semibold">Предпросмотр не найден</h1>
          <p className="text-muted-foreground">
            Вернитесь в редактор и нажмите «Предпросмотр» ещё раз.
          </p>
          <Button asChild>
            <Link href="/dashboard/media">К материалам</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <div className="rounded-2xl border bg-card p-6 shadow-elevation-1">
        <p className="text-sm font-medium text-primary">Предпросмотр</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal">
          {payload.title || "Без названия"}
        </h1>
        {payload.description ? (
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {payload.description}
          </p>
        ) : null}
      </div>
      {payload.coverUrl ? (
        <div className="overflow-hidden rounded-2xl border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="aspect-[16/9] w-full object-cover"
            src={payload.coverUrl}
          />
        </div>
      ) : null}
      <MaterialContentRenderer document={payload.document} />
    </article>
  )
}
