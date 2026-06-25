"use client"

import { useState } from "react"
import { Plus, Trash2 } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RequiredLabel } from "@/components/ui/required-label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { DashboardStorySlide } from "@/components/dashboard/stories-modal"
import type { AdminDashboardStoryHighlight } from "@/lib/supabase/admin-queries"

type DashboardStoriesEditorProps = {
  highlights: AdminDashboardStoryHighlight[]
  saveAction: (formData: FormData) => void | Promise<void>
  deleteAction: (formData: FormData) => void | Promise<void>
}

type EditableSlide = DashboardStorySlide

function emptySlide(): EditableSlide {
  return {
    id: crypto.randomUUID(),
    eyebrow: "",
    title: "",
    description: "",
    backgroundUrl: "",
    backgroundColor: "#1E2420",
    textColor: "#FFFFFF",
    textPosition: "bottom",
    backgroundSize: "cover",
    ctaLabel: "",
    ctaUrl: "",
  }
}

async function uploadImage(file: File) {
  const body = new FormData()
  body.append("image", file)
  const response = await fetch("/api/materials/upload", {
    method: "POST",
    body,
  })
  const result = (await response.json()) as {
    success?: number
    file?: { url?: string }
  }
  return result.file?.url ?? ""
}

export function DashboardStoriesEditor({
  highlights,
  saveAction,
  deleteAction,
}: DashboardStoriesEditorProps) {
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Сторис онбординга</h1>
          <p className="mt-2 text-muted-foreground">
            Настройте кружки-хайлайты для кабинетов подрядчика и заказчика.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} type="button">
          <Plus /> Добавить
        </Button>
      </div>

      {creating ? (
        <StoryForm
          deleteAction={deleteAction}
          onCancel={() => setCreating(false)}
          saveAction={saveAction}
        />
      ) : null}

      {highlights.length > 0 ? (
        <div className="grid gap-5">
          {highlights.map((highlight) => (
            <StoryForm
              deleteAction={deleteAction}
              highlight={highlight}
              key={highlight.id}
              saveAction={saveAction}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Настроенных сторис пока нет. Кабинеты используют дефолтные хайлайты
            из кода.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StoryForm({
  highlight,
  saveAction,
  deleteAction,
  onCancel,
}: {
  highlight?: AdminDashboardStoryHighlight
  saveAction: (formData: FormData) => void | Promise<void>
  deleteAction: (formData: FormData) => void | Promise<void>
  onCancel?: () => void
}) {
  const [slides, setSlides] = useState<EditableSlide[]>(
    highlight?.slides?.length ? highlight.slides : [emptySlide()],
  )

  function updateSlide(
    id: string,
    patch: Partial<EditableSlide>,
  ) {
    setSlides((current) =>
      current.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{highlight ? highlight.label : "Новый хайлайт"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={saveAction} className="space-y-6">
          <input name="id" type="hidden" value={highlight?.id ?? ""} />
          <input name="slides_json" type="hidden" value={JSON.stringify(slides)} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <RequiredLabel required>Аудитория</RequiredLabel>
              <Select
                defaultValue={highlight?.audience ?? "contractor"}
                name="audience"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contractor">Подрядчик</SelectItem>
                  <SelectItem value="client">Компания / HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field
              defaultValue={highlight?.label ?? ""}
              label="Название кружка"
              name="label"
              required
            />
            <Field
              defaultValue={highlight?.title ?? ""}
              label="Внутреннее название"
              name="title"
            />
            <div className="space-y-2">
              <RequiredLabel>Иконка</RequiredLabel>
              <Select defaultValue={highlight?.icon ?? "sparkles"} name="icon">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sparkles">Sparkles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="briefcase">Briefcase</SelectItem>
                  <SelectItem value="heart">Heart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field
              defaultValue={String(highlight?.sort_order ?? 100)}
              label="Порядок"
              name="sort_order"
              type="number"
            />
            <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <Checkbox
                defaultChecked={highlight?.is_active ?? true}
                name="is_active"
              />
              Активно
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-medium">Слайды внутри кружка</h2>
              <Button
                onClick={() => setSlides((current) => [...current, emptySlide()])}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus /> Слайд
              </Button>
            </div>

            {slides.map((slide, index) => (
              <SlideEditor
                index={index}
                key={slide.id}
                onRemove={() =>
                  setSlides((current) =>
                    current.length > 1
                      ? current.filter((item) => item.id !== slide.id)
                      : current,
                  )
                }
                onUpdate={(patch) => updateSlide(slide.id, patch)}
                slide={slide}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit">Сохранить</Button>
            {onCancel ? (
              <Button onClick={onCancel} type="button" variant="ghost">
                Отмена
              </Button>
            ) : null}
          </div>
        </form>

        {highlight ? (
          <form action={deleteAction} className="mt-3">
            <input name="id" type="hidden" value={highlight.id} />
            <Button type="submit" variant="destructive">
              <Trash2 /> Удалить хайлайт
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}

function SlideEditor({
  slide,
  index,
  onUpdate,
  onRemove,
}: {
  slide: EditableSlide
  index: number
  onUpdate: (patch: Partial<EditableSlide>) => void
  onRemove: () => void
}) {
  const [uploading, setUploading] = useState(false)

  return (
    <div className="grid gap-4 rounded-xl border p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label={`Слайд ${index + 1}: надпись сверху`}
          onValueChange={(value) => onUpdate({ eyebrow: value })}
          value={slide.eyebrow ?? ""}
        />
        <Field
          label="Заголовок"
          onValueChange={(value) => onUpdate({ title: value })}
          required
          value={slide.title}
        />
        <div className="space-y-2 md:col-span-2">
          <RequiredLabel required>Описание</RequiredLabel>
          <Textarea
            onChange={(event) => onUpdate({ description: event.target.value })}
            value={slide.description}
          />
        </div>
        <Field
          label="Фон-картинка URL"
          onValueChange={(value) => onUpdate({ backgroundUrl: value })}
          value={slide.backgroundUrl ?? ""}
        />
        <div className="space-y-2">
          <RequiredLabel>Загрузить фон</RequiredLabel>
          <Input
            accept="image/*"
            disabled={uploading}
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              setUploading(true)
              try {
                const url = await uploadImage(file)
                if (url) onUpdate({ backgroundUrl: url })
              } finally {
                setUploading(false)
              }
            }}
            type="file"
          />
        </div>
        <Field
          label="Цвет фона"
          onValueChange={(value) => onUpdate({ backgroundColor: value })}
          type="color"
          value={slide.backgroundColor ?? "#1E2420"}
        />
        <Field
          label="Цвет текста"
          onValueChange={(value) => onUpdate({ textColor: value })}
          type="color"
          value={slide.textColor ?? "#FFFFFF"}
        />
        <div className="space-y-2">
          <RequiredLabel>Позиция текста</RequiredLabel>
          <Select
            onValueChange={(value) =>
              onUpdate({
                textPosition: value as EditableSlide["textPosition"],
              })
            }
            value={slide.textPosition ?? "bottom"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Сверху</SelectItem>
              <SelectItem value="center">По центру</SelectItem>
              <SelectItem value="bottom">Снизу</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <RequiredLabel>Размер фона</RequiredLabel>
          <Select
            onValueChange={(value) =>
              onUpdate({
                backgroundSize: value as EditableSlide["backgroundSize"],
              })
            }
            value={slide.backgroundSize ?? "cover"}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Заполнить</SelectItem>
              <SelectItem value="contain">Уместить</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Field
          label="Кнопка"
          onValueChange={(value) => onUpdate({ ctaLabel: value })}
          value={slide.ctaLabel ?? ""}
        />
        <Field
          label="Ссылка кнопки"
          onValueChange={(value) => onUpdate({ ctaUrl: value })}
          value={slide.ctaUrl ?? ""}
        />
      </div>

      <div
        className="relative flex min-h-[320px] overflow-hidden rounded-2xl p-4"
        style={{
          backgroundColor: slide.backgroundColor || "#1E2420",
          color: slide.textColor || "#FFFFFF",
        }}
      >
        {slide.backgroundUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className={
              slide.backgroundSize === "contain"
                ? "absolute inset-0 h-full w-full object-contain"
                : "absolute inset-0 h-full w-full object-cover"
            }
            src={slide.backgroundUrl}
          />
        ) : null}
        <div className="absolute inset-0 bg-black/20" />
        <div
          className={
            slide.textPosition === "top"
              ? "relative z-10 flex flex-1 flex-col justify-start"
              : slide.textPosition === "center"
                ? "relative z-10 flex flex-1 flex-col justify-center"
                : "relative z-10 flex flex-1 flex-col justify-end"
          }
        >
          <p className="text-xs opacity-80">{slide.eyebrow}</p>
          <strong className="mt-1 text-xl leading-tight">{slide.title}</strong>
          <p className="mt-2 text-sm opacity-85">{slide.description}</p>
          {slide.ctaLabel ? (
            <span className="mt-4 w-fit rounded-full bg-white/90 px-3 py-1 text-xs text-black">
              {slide.ctaLabel}
            </span>
          ) : null}
        </div>
      </div>

      <Button
        className="lg:col-span-2"
        onClick={onRemove}
        type="button"
        variant="outline"
      >
        <Trash2 /> Удалить слайд
      </Button>
    </div>
  )
}

function Field({
  label,
  name,
  value,
  defaultValue,
  type = "text",
  required = false,
  onValueChange,
}: {
  label: string
  name?: string
  value?: string
  defaultValue?: string
  type?: string
  required?: boolean
  onValueChange?: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <RequiredLabel required={required}>{label}</RequiredLabel>
      <Input
        defaultValue={defaultValue}
        name={name}
        onChange={
          onValueChange
            ? (event) => onValueChange(event.target.value)
            : undefined
        }
        required={required}
        type={type}
        value={value}
      />
    </div>
  )
}
