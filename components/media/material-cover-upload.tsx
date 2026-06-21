"use client"

import { useRef, useState } from "react"
import { ImageOff, Plus, Trash2 } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type MaterialCoverUploadProps = {
  value: string
  onChange: (value: string) => void
}

export function MaterialCoverUpload({
  value,
  onChange,
}: MaterialCoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setIsUploading(true)
    setError(null)
    const body = new FormData()
    body.append("image", file)
    try {
      const response = await fetch("/api/materials/upload", {
        method: "POST",
        body,
      })
      const result = (await response.json()) as {
        file?: { url?: string }
        error?: string
      }
      if (!response.ok || !result.file?.url) {
        throw new Error(result.error ?? "Не удалось загрузить изображение")
      }
      onChange(result.file.url)
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Не удалось загрузить изображение",
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <input name="cover_url" type="hidden" value={value} />
      <input
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
          event.target.value = ""
        }}
        ref={inputRef}
        type="file"
      />
      {value ? (
        <div className="relative aspect-[16/7] overflow-hidden rounded-lg border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Предпросмотр обложки"
            className="h-full w-full object-cover"
            src={value}
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              size="sm"
              type="button"
              variant="secondary"
            >
              Заменить
            </Button>
            <Button
              aria-label="Удалить обложку"
              onClick={() => onChange("")}
              size="icon"
              type="button"
              variant="destructive"
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ) : (
        <button
          className="flex aspect-[16/7] w-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <span className="grid size-11 place-items-center rounded-full bg-background shadow-sm">
            {isUploading ? (
              <ImageOff className="size-5" />
            ) : (
              <Plus className="size-5" />
            )}
          </span>
          <span className="mt-3 text-sm font-medium">
            {isUploading ? "Загружаем..." : "Добавить обложку"}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, WebP или GIF до 10 МБ
          </span>
        </button>
      )}
      <Input
        aria-label="URL обложки"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Или вставьте ссылку на изображение"
        value={value}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
