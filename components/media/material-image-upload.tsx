"use client"

import { useRef, useState } from "react"
import { ImageOff, Plus, Trash2 } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MaterialImageUploadProps = {
  value: string
  onChange: (value: string) => void
  label: string
  className?: string
}

export function MaterialImageUpload({
  value,
  onChange,
  label,
  className,
}: MaterialImageUploadProps) {
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
        uploadError instanceof Error ? uploadError.message : "Ошибка загрузки",
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        accept="image/jpeg,image/png,image/gif,image/webp"
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
        <div className="relative size-24 overflow-hidden rounded-lg border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={label} className="size-full object-cover" src={value} />
          <Button
            aria-label={`Удалить ${label.toLowerCase()}`}
            className="absolute bottom-1 right-1"
            onClick={() => onChange("")}
            size="icon"
            type="button"
            variant="destructive"
          >
            <Trash2 />
          </Button>
        </div>
      ) : (
        <button
          className="grid size-24 place-items-center rounded-lg border border-dashed bg-muted/30 text-muted-foreground hover:border-primary/50"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {isUploading ? <ImageOff /> : <Plus />}
          <span className="sr-only">{label}</span>
        </button>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
