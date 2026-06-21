"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Check, Eye, Send, Trash2 } from "@/components/ui/icons"

import { MaterialBlockEditor } from "@/components/media/material-block-editor"
import { MaterialCoverUpload } from "@/components/media/material-cover-upload"
import { MaterialPreview } from "@/components/media/material-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RequiredLabel } from "@/components/ui/required-label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  calculateMaterialQuality,
  getMissingCaseSections,
  type MaterialDocument,
} from "@/lib/material-content"
import type { ContentOwner, Material, Service } from "@/types"

type MaterialFields = {
  title: string
  description: string
  coverUrl: string
  category: string
  tags: string
  owner: string
  author: string
  clientName: string
  clientUrl: string
  industry: string
  services: string
  specialists: string
  projectTeam: string
  relatedOrganizations: string
  relatedExperts: string
  audienceQuestion: string
  readingTime: string
  publishedAt: string
}

type MaterialCmsFormProps = {
  action: (formData: FormData) => void | Promise<void>
  type: "case" | "article"
  owners: ContentOwner[]
  services: Service[]
  material?: Material | null
  initialDocument: MaterialDocument
  message?: string | null
}

function stringMeta(document: MaterialDocument, key: string) {
  const value = document.meta?.[key]
  return typeof value === "string" ? value : ""
}

export function MaterialCmsForm({
  action,
  type,
  owners,
  services,
  material,
  initialDocument,
  message,
}: MaterialCmsFormProps) {
  const initialOwner =
    material?.owner_type === "expert" && material.expert_id
      ? `expert:${material.expert_id}`
      : material?.organization_id || material?.company_id
        ? `organization:${material.organization_id ?? material.company_id}`
        : owners[0]
          ? `${owners[0].owner_type}:${owners[0].owner_id}`
          : ""
  const [fields, setFields] = useState<MaterialFields>({
    title: material?.title ?? "",
    description: material?.description ?? "",
    coverUrl: material?.cover_url ?? "",
    category: material?.category ?? stringMeta(initialDocument, "category"),
    tags: material?.tags ?? stringMeta(initialDocument, "tags"),
    owner: initialOwner,
    author: material?.author ?? "",
    clientName: stringMeta(initialDocument, "client_name"),
    clientUrl: stringMeta(initialDocument, "client_url"),
    industry: stringMeta(initialDocument, "industry"),
    services: stringMeta(initialDocument, "services"),
    specialists: stringMeta(initialDocument, "specialists"),
    projectTeam: stringMeta(initialDocument, "project_team"),
    relatedOrganizations: stringMeta(initialDocument, "related_organizations"),
    relatedExperts: stringMeta(initialDocument, "related_experts"),
    audienceQuestion: stringMeta(initialDocument, "audience_question"),
    readingTime: material?.reading_time ? String(material.reading_time) : "",
    publishedAt: material?.published_at?.slice(0, 10) ?? "",
  })
  const [document, setDocument] = useState(initialDocument)
  const [draftId, setDraftId] = useState(material?.id ?? "")
  const [isDirty, setIsDirty] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")
  const [previewOpen, setPreviewOpen] = useState(false)
  const statusRef = useRef<HTMLInputElement>(null)
  const intentRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const autosaveTimeoutRef = useRef<number | null>(null)
  const submittingRef = useRef(false)
  const storageKey = `srchr:material:v2:${material?.id ?? type}:draft`

  const documentForSave = useMemo<MaterialDocument>(
    () => ({
      ...document,
      meta: {
        ...document.meta,
        category: fields.category,
        tags: fields.tags,
        client_name: fields.clientName,
        client_url: fields.clientUrl,
        industry: fields.industry,
        services: fields.services,
        specialists: fields.specialists,
        project_team: fields.projectTeam,
        related_organizations: fields.relatedOrganizations,
        related_experts: fields.relatedExperts,
        audience_question: fields.audienceQuestion,
      },
    }),
    [document, fields],
  )
  const quality = calculateMaterialQuality({
    type,
    title: fields.title,
    description: fields.description,
    coverUrl: fields.coverUrl,
    category: fields.category,
    tags: fields.tags,
    owner: fields.owner,
    document: documentForSave,
  })

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      setIsHydrated(true)
      return
    }
    try {
      const saved = JSON.parse(raw) as {
        fields?: MaterialFields
        document?: MaterialDocument
        draftId?: string
      }
      if (saved.fields) setFields(saved.fields)
      if (saved.document?.version === 2) setDocument(saved.document)
      if (saved.draftId) setDraftId(saved.draftId)
      setIsDirty(true)
    } catch {
      window.localStorage.removeItem(storageKey)
    } finally {
      setIsHydrated(true)
    }
  }, [storageKey])

  useEffect(() => {
    if (!isDirty) return
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ fields, document: documentForSave, draftId }),
    )
    const timeout = window.setTimeout(async () => {
      autosaveTimeoutRef.current = null
      if (submittingRef.current) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setSaveState("saving")
      try {
        const response = await fetch("/api/materials/autosave", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            id: draftId || null,
            type,
            title: fields.title,
            description: fields.description,
            cover_url: fields.coverUrl,
            category: fields.category,
            tags: fields.tags,
            owner: fields.owner,
            author: fields.author,
            content: documentForSave,
          }),
        })
        const result = (await response.json()) as {
          id?: string
          error?: string
        }
        if (!response.ok)
          throw new Error(result.error ?? "Ошибка автосохранения")
        if (result.id) setDraftId(result.id)
        setSaveState("saved")
        setIsDirty(false)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setSaveState("error")
      }
    }, 1500)
    autosaveTimeoutRef.current = timeout
    return () => {
      window.clearTimeout(timeout)
      if (autosaveTimeoutRef.current === timeout) {
        autosaveTimeoutRef.current = null
      }
    }
  }, [documentForSave, draftId, fields, isDirty, storageKey, type])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [isDirty])

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    [],
  )

  function updateField<Key extends keyof MaterialFields>(
    key: Key,
    value: MaterialFields[Key],
  ) {
    setFields((current) => ({ ...current, [key]: value }))
    setIsDirty(true)
    setSaveState("idle")
  }

  function prepareSubmit(intent: "save" | "moderate" | "delete") {
    submittingRef.current = true
    if (autosaveTimeoutRef.current !== null) {
      window.clearTimeout(autosaveTimeoutRef.current)
      autosaveTimeoutRef.current = null
    }
    abortRef.current?.abort()
    if (statusRef.current) {
      statusRef.current.value = intent === "moderate" ? "moderation" : "draft"
    }
    if (intentRef.current) intentRef.current.value = intent
  }

  const missingSections =
    type === "case" ? getMissingCaseSections(documentForSave) : []

  return (
    <form action={action} className="space-y-6" data-material-form>
      <input name="id" type="hidden" value={draftId} />
      <input name="type" type="hidden" value={type} />
      <input
        name="content_json"
        type="hidden"
        value={JSON.stringify(documentForSave)}
      />
      <input name="intent" ref={intentRef} type="hidden" value="save" />
      <input
        name="status"
        ref={statusRef}
        type="hidden"
        value={material?.status ?? "draft"}
      />

      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {type === "case" ? "Кейс" : "Статья"}
            </Badge>
            <Badge variant="secondary">{material?.status ?? "Черновик"}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">
            {material
              ? "Редактировать материал"
              : type === "case"
                ? "Создать кейс"
                : "Создать статью"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Соберите материал из независимых блоков и отправьте его на
            модерацию.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {saveState === "saving"
              ? "Сохраняем..."
              : saveState === "saved"
                ? "Сохранено"
                : saveState === "error"
                  ? "Ошибка сохранения"
                  : isDirty
                    ? "Есть изменения"
                    : ""}
          </span>
          <Button
            onClick={() => setPreviewOpen(true)}
            type="button"
            variant="outline"
          >
            <Eye /> Предпросмотр
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard/media">Закрыть</Link>
          </Button>
        </div>
      </div>

      {message ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <RequiredLabel required>Обложка</RequiredLabel>
                <MaterialCoverUpload
                  value={fields.coverUrl}
                  onChange={(value) => updateField("coverUrl", value)}
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="title" required>
                  Заголовок
                </RequiredLabel>
                <Input
                  id="title"
                  name="title"
                  value={fields.title}
                  onChange={(event) => updateField("title", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="description" required>
                  Короткое описание
                </RequiredLabel>
                <Textarea
                  id="description"
                  maxLength={300}
                  name="description"
                  value={fields.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
                <p className="text-right text-xs text-muted-foreground">
                  {fields.description.length}/300
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="category" required>
                    Категория / тема
                  </RequiredLabel>
                  <Input
                    id="category"
                    list="material-services"
                    name="category"
                    value={fields.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                  />
                  <datalist id="material-services">
                    {services.map((service) => (
                      <option key={service.id} value={service.name} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="tags" required>
                    Теги
                  </RequiredLabel>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="EVP, исследования, HR-бренд"
                    value={fields.tags}
                    onChange={(event) =>
                      updateField("tags", event.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Автор и связи</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <RequiredLabel required>Публиковать от имени</RequiredLabel>
                <Select
                  value={fields.owner}
                  onValueChange={(value) => updateField("owner", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите автора" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem
                        key={`${owner.owner_type}:${owner.owner_id}`}
                        value={`${owner.owner_type}:${owner.owner_id}`}
                      >
                        {owner.owner_type === "expert"
                          ? "Эксперт"
                          : "Организация"}
                        : {owner.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input name="owner" type="hidden" value={fields.owner} />
              </div>
              {type === "case" ? (
                <>
                  <TextInput
                    label="Клиент"
                    name="client_name"
                    value={fields.clientName}
                    onChange={(value) => updateField("clientName", value)}
                  />
                  <TextInput
                    label="Сайт клиента"
                    name="client_url"
                    value={fields.clientUrl}
                    onChange={(value) => updateField("clientUrl", value)}
                  />
                  <TextInput
                    label="Индустрия"
                    name="industry"
                    value={fields.industry}
                    onChange={(value) => updateField("industry", value)}
                  />
                  <TextInput
                    label="Связанные услуги"
                    name="services"
                    value={fields.services}
                    onChange={(value) => updateField("services", value)}
                  />
                  <TextInput
                    label="Специалисты"
                    name="specialists"
                    value={fields.specialists}
                    onChange={(value) => updateField("specialists", value)}
                  />
                  <TextInput
                    label="Команда проекта"
                    name="project_team"
                    value={fields.projectTeam}
                    onChange={(value) => updateField("projectTeam", value)}
                  />
                </>
              ) : (
                <>
                  <TextInput
                    label="Подпись автора"
                    name="author"
                    value={fields.author}
                    onChange={(value) => updateField("author", value)}
                  />
                  <TextInput
                    label="Связанные услуги"
                    name="service"
                    value={fields.services}
                    onChange={(value) => updateField("services", value)}
                  />
                  <TextInput
                    label="Связанные организации"
                    name="related_organizations"
                    value={fields.relatedOrganizations}
                    onChange={(value) =>
                      updateField("relatedOrganizations", value)
                    }
                  />
                  <TextInput
                    label="Связанные эксперты"
                    name="related_experts"
                    value={fields.relatedExperts}
                    onChange={(value) => updateField("relatedExperts", value)}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Контент</CardTitle>
            </CardHeader>
            <CardContent>
              {isHydrated ? (
                <MaterialBlockEditor
                  document={document}
                  onChange={(value) => {
                    setDocument(value)
                    setIsDirty(true)
                    setSaveState("idle")
                  }}
                />
              ) : (
                <div className="h-72 animate-pulse rounded-lg bg-muted" />
              )}
              {missingSections.length > 0 ? (
                <p className="mt-3 text-sm text-destructive">
                  Перед модерацией восстановите разделы:{" "}
                  {missingSections.map((item) => item.title).join(", ")}.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Настройки публикации</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {type === "article" ? (
                <>
                  <TextInput
                    label="Время чтения, мин"
                    name="reading_time"
                    type="number"
                    value={fields.readingTime}
                    onChange={(value) => updateField("readingTime", value)}
                  />
                  <TextInput
                    label="Планируемая дата"
                    name="published_at"
                    type="date"
                    value={fields.publishedAt}
                    onChange={(value) => updateField("publishedAt", value)}
                  />
                  <div className="space-y-2 md:col-span-2">
                    <RequiredLabel htmlFor="audience_question">
                      Вопрос аудитории
                    </RequiredLabel>
                    <Textarea
                      id="audience_question"
                      name="audience_question"
                      value={fields.audienceQuestion}
                      onChange={(event) =>
                        updateField("audienceQuestion", event.target.value)
                      }
                    />
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Качество материала</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-semibold">
                  {quality.percent}%
                </span>
                <span className="text-xs text-muted-foreground">заполнено</span>
              </div>
              <Progress className="mt-3" value={quality.percent} />
              {quality.missing.length > 0 ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Добавьте: {quality.missing.join(", ")}.
                </p>
              ) : (
                <p className="mt-4 text-sm text-primary">
                  Материал готов к модерации.
                </p>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-2">
            <Button
              disabled={saveState === "saving"}
              onClick={() => prepareSubmit("save")}
              type="submit"
              variant="outline"
            >
              <Check /> Сохранить черновик
            </Button>
            <Button
              disabled={saveState === "saving" || quality.percent < 100}
              onClick={() => prepareSubmit("moderate")}
              type="submit"
            >
              <Send /> На модерацию
            </Button>
            {draftId && (material?.status ?? "draft") === "draft" ? (
              <Button
                onClick={(event) => {
                  if (!window.confirm("Удалить черновик?")) {
                    event.preventDefault()
                    return
                  }
                  prepareSubmit("delete")
                }}
                type="submit"
                variant="destructive"
              >
                <Trash2 /> Удалить
              </Button>
            ) : null}
          </div>
        </aside>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{fields.title || "Без названия"}</DialogTitle>
            <DialogDescription>
              {fields.description || "Короткое описание не заполнено"}
            </DialogDescription>
          </DialogHeader>
          <MaterialPreview document={documentForSave} />
        </DialogContent>
      </Dialog>
    </form>
  )
}

function TextInput({
  label,
  name,
  value,
  type = "text",
  onChange,
}: {
  label: string
  name: string
  value: string
  type?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={name}>{label}</RequiredLabel>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
