"use client"

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Eye, Plus, Send, Trash2 } from "@/components/ui/icons"

import { MaterialCoverUpload } from "@/components/media/material-cover-upload"
import { MaterialClientPicker } from "@/components/media/material-client-picker"
import { MaterialImageUpload } from "@/components/media/material-image-upload"
import { MaterialPreview } from "@/components/media/material-preview"
import { MultiServiceSelect } from "@/components/media/multi-service-select"
import { RichTextField } from "@/components/media/rich-text-field"
import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  caseDescription,
  createCaseWizardDocument,
  getCaseWizardData,
  getMissingCaseWizardFields,
  type CaseAward,
  type CaseTeamMember,
  type CaseWizardData,
} from "@/lib/material-case"
import type { MaterialDocument } from "@/lib/material-content"
import type { ContentOwner, Material, Organization, Service } from "@/types"

type CaseMaterialWizardProps = {
  action: (formData: FormData) => void | Promise<void>
  owners: ContentOwner[]
  services: Service[]
  clients: Organization[]
  material?: Material | null
  initialDocument: MaterialDocument
  message?: string | null
}

const steps = ["О проекте", "Задача и решение", "Результат и команда"] as const

export function CaseMaterialWizard({
  action,
  owners,
  services,
  clients,
  material,
  initialDocument,
  message,
}: CaseMaterialWizardProps) {
  const router = useRouter()
  const initialOwner =
    material?.owner_type === "expert" && material.expert_id
      ? `expert:${material.expert_id}`
      : material?.organization_id || material?.company_id
        ? `organization:${material.organization_id ?? material.company_id}`
        : owners[0]
          ? `${owners[0].owner_type}:${owners[0].owner_id}`
          : ""
  const storageKey = `srchr:material:v3:${material?.id ?? "case-new"}:draft`
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState(material?.title ?? "")
  const [coverUrl, setCoverUrl] = useState(material?.cover_url ?? "")
  const [owner, setOwner] = useState(initialOwner)
  const [data, setData] = useState(() => getCaseWizardData(initialDocument))
  const [draftId, setDraftId] = useState(material?.id ?? "")
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const statusRef = useRef<HTMLInputElement>(null)
  const intentRef = useRef<HTMLInputElement>(null)
  const idRef = useRef<HTMLInputElement>(null)
  const autosaveIdRef = useRef(material?.id ?? crypto.randomUUID())
  const formRef = useRef<HTMLFormElement>(null)
  const dirtyRef = useRef(false)

  const description = caseDescription(data.projectAbout)
  const document = useMemo(
    () => createCaseWizardDocument(initialDocument, data),
    [data, initialDocument],
  )
  const missing = getMissingCaseWizardFields({ title, coverUrl, owner, data })
  const quality = Math.round(((11 - missing.length) / 11) * 100)
  const canDeleteDraft = !material || (material.status ?? "draft") === "draft"

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey)
    if (raw) {
      try {
        const saved = JSON.parse(raw) as {
          title?: string
          coverUrl?: string
          owner?: string
          data?: CaseWizardData
          draftId?: string
        }
        if (typeof saved.title === "string") setTitle(saved.title)
        if (typeof saved.coverUrl === "string") setCoverUrl(saved.coverUrl)
        if (typeof saved.owner === "string") setOwner(saved.owner)
        if (saved.data) {
          setData((current) => ({
            ...current,
            ...saved.data,
            team: saved.data?.team ?? [],
            awards: saved.data?.awards ?? [],
            serviceNames: saved.data?.serviceNames ?? [],
          }))
        }
        if (saved.draftId) {
          autosaveIdRef.current = saved.draftId
          setDraftId(saved.draftId)
        }
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }
    setHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!hydrated) return
    const hasStarted = Boolean(
      title.trim() ||
      coverUrl ||
      description ||
      data.clientName.trim() ||
      data.task.trim() ||
      data.solution.trim() ||
      data.result.trim(),
    )
    if (!hasStarted && !material) return
    dirtyRef.current = true
    setSaveState("idle")
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ title, coverUrl, owner, data, draftId }),
    )

    if (material && !["draft", "rejected"].includes(material.status ?? "draft"))
      return
    const timeout = window.setTimeout(async () => {
      setSaveState("saving")
      try {
        const response = await fetch("/api/materials/autosave", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: autosaveIdRef.current,
            type: "case",
            title,
            description,
            cover_url: coverUrl,
            category: data.serviceNames[0] ?? "",
            tags: data.serviceNames.join(", "),
            owner,
            content: document,
          }),
        })
        const result = (await response.json()) as {
          id?: string
          error?: string
        }
        if (!response.ok || !result.id)
          throw new Error(result.error ?? "Ошибка автосохранения")
        autosaveIdRef.current = result.id
        if (idRef.current) idRef.current.value = result.id
        setDraftId(result.id)
        setSaveState("saved")
        dirtyRef.current = false
      } catch {
        setSaveState("error")
      }
    }, 1600)

    return () => window.clearTimeout(timeout)
  }, [
    coverUrl,
    data,
    description,
    document,
    draftId,
    hydrated,
    material,
    owner,
    storageKey,
    title,
  ])

  useEffect(() => {
    function persistBeforeClose() {
      if (!dirtyRef.current) return
      const body = JSON.stringify({
        id: autosaveIdRef.current,
        type: "case",
        title,
        description,
        cover_url: coverUrl,
        category: data.serviceNames[0] ?? "",
        tags: data.serviceNames.join(", "),
        owner,
        content: document,
      })
      navigator.sendBeacon(
        "/api/materials/autosave",
        new Blob([body], { type: "application/json" }),
      )
    }

    window.addEventListener("beforeunload", persistBeforeClose)
    return () => window.removeEventListener("beforeunload", persistBeforeClose)
  }, [coverUrl, data.serviceNames, description, document, owner, title])

  function updateData<Key extends keyof CaseWizardData>(
    key: Key,
    value: CaseWizardData[Key],
  ) {
    setData((current) => ({ ...current, [key]: value }))
  }

  function prepareSubmit(intent: "save" | "moderate" | "delete") {
    if (statusRef.current)
      statusRef.current.value = intent === "moderate" ? "moderation" : "draft"
    if (intentRef.current) intentRef.current.value = intent
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (statusRef.current?.value === "moderation" && missing.length > 0) {
      event.preventDefault()
      setValidationError(`Заполните: ${missing.join(", ")}.`)
      const firstMissing = missing[0]
      setStep(
        ["задача", "решение"].includes(firstMissing)
          ? 1
          : firstMissing === "результат"
            ? 2
            : 0,
      )
    }
  }

  function addTeamMember() {
    const member: CaseTeamMember = {
      id: crypto.randomUUID(),
      photoUrl: "",
      name: "",
      position: "",
      company: "",
    }
    updateData("team", [...data.team, member])
  }

  function addAward() {
    const award: CaseAward = { id: crypto.randomUUID(), title: "", url: "" }
    updateData("awards", [...data.awards, award])
  }

  async function cleanupUploads() {
    const urls = [
      coverUrl,
      data.clientLogoUrl,
      ...data.team.map((member) => member.photoUrl),
    ].filter(Boolean)
    if (urls.length === 0) return
    await fetch("/api/materials/upload", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ urls }),
    }).catch(() => undefined)
  }

  async function discardAndClose() {
    window.localStorage.removeItem(storageKey)
    await cleanupUploads()
    if (draftId) {
      prepareSubmit("delete")
      formRef.current?.requestSubmit()
      return
    }
    router.push("/dashboard/media")
  }

  return (
    <form
      action={action}
      className="space-y-6"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <input defaultValue={draftId} name="id" ref={idRef} type="hidden" />
      <input name="type" type="hidden" value="case" />
      <input name="status" ref={statusRef} type="hidden" value="draft" />
      <input name="intent" ref={intentRef} type="hidden" value="save" />
      <input name="storage_key" type="hidden" value={storageKey} />
      <input name="title" type="hidden" value={title} />
      <input name="description" type="hidden" value={description} />
      <input name="cover_url" type="hidden" value={coverUrl} />
      <input name="owner" type="hidden" value={owner} />
      <input name="category" type="hidden" value={data.serviceNames[0] ?? ""} />
      <input name="tags" type="hidden" value={data.serviceNames.join(", ")} />
      <input
        name="services"
        type="hidden"
        value={data.serviceNames.join(", ")}
      />
      <input name="client_name" type="hidden" value={data.clientName} />
      <input name="client_url" type="hidden" value={data.projectUrl} />
      <input name="budget_range" type="hidden" value={data.budget} />
      <input name="project_duration" type="hidden" value={data.duration} />
      <input
        name="content_json"
        type="hidden"
        value={JSON.stringify(document)}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex gap-2">
            <Badge>Кейс</Badge>
            <Badge variant="secondary">{material?.status ?? "Черновик"}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">
            {material ? "Редактировать кейс" : "Создать кейс"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {saveState === "saving"
              ? "Сохраняем..."
              : saveState === "saved"
                ? "Сохранено"
                : saveState === "error"
                  ? "Ошибка автосохранения"
                  : ""}
          </span>
          <Button
            onClick={() => setPreviewOpen(true)}
            type="button"
            variant="outline"
          >
            <Eye /> Предпросмотр
          </Button>
          <Button
            onClick={() => setCloseOpen(true)}
            type="button"
            variant="ghost"
          >
            Закрыть
          </Button>
        </div>
      </div>

      {message ? <Alert variant="destructive">{message}</Alert> : null}
      {validationError ? (
        <Alert variant="destructive">{validationError}</Alert>
      ) : null}

      <nav
        aria-label="Шаги создания кейса"
        className="grid gap-2 sm:grid-cols-3"
      >
        {steps.map((label, index) => (
          <Button
            className="justify-start"
            key={label}
            onClick={() => setStep(index)}
            type="button"
            variant={step === index ? "default" : "outline"}
          >
            <span className="grid size-6 place-items-center rounded-full bg-background/20 text-xs">
              {index + 1}
            </span>
            {label}
          </Button>
        ))}
      </nav>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {step === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>О проекте</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="case-title" required>
                    Заголовок
                  </RequiredLabel>
                  <Input
                    id="case-title"
                    onChange={(event) => setTitle(event.target.value)}
                    value={title}
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="project-about" required>
                    О проекте
                  </RequiredLabel>
                  <RichTextField
                    id="project-about"
                    onChange={(value) => updateData("projectAbout", value)}
                    placeholder="Коротко расскажите о проекте. Из этого текста сформируется описание карточки."
                    value={data.projectAbout}
                  />
                  <p className="text-xs text-muted-foreground">
                    Описание карточки:{" "}
                    {description || "появится после заполнения"}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="project-url">
                      Ссылка на проект
                    </RequiredLabel>
                    <Input
                      id="project-url"
                      onChange={(event) =>
                        updateData("projectUrl", event.target.value)
                      }
                      placeholder="https://"
                      type="url"
                      value={data.projectUrl}
                    />
                  </div>
                  <div className="space-y-2">
                    <RequiredLabel required>Категории и услуги</RequiredLabel>
                    <MultiServiceSelect
                      onChange={(value) => updateData("serviceNames", value)}
                      services={services}
                      value={data.serviceNames}
                    />
                  </div>
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="duration" required>
                      Срок реализации
                    </RequiredLabel>
                    <Input
                      id="duration"
                      onChange={(event) =>
                        updateData("duration", event.target.value)
                      }
                      placeholder="Например, 3 месяца"
                      value={data.duration}
                    />
                  </div>
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="budget" required>
                      Бюджет
                    </RequiredLabel>
                    <Input
                      id="budget"
                      onChange={(event) =>
                        updateData("budget", event.target.value)
                      }
                      placeholder="Например, 500 000 ₽"
                      value={data.budget}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={data.hideBudget}
                        onCheckedChange={(checked) =>
                          updateData("hideBudget", checked === true)
                        }
                      />
                      Скрыть бюджет по NDA
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <RequiredLabel required>Обложка</RequiredLabel>
                  <MaterialCoverUpload
                    onChange={setCoverUrl}
                    value={coverUrl}
                  />
                </div>
                <div className="space-y-3">
                  <RequiredLabel htmlFor="client-name" required>
                    Клиент
                  </RequiredLabel>
                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <MaterialClientPicker
                      clients={clients}
                      onChange={(name, logoUrl) => {
                        updateData("clientName", name)
                        updateData("clientLogoUrl", logoUrl ?? "")
                      }}
                      value={data.clientName}
                    />
                    <MaterialImageUpload
                      label="Логотип клиента"
                      onChange={(value) => updateData("clientLogoUrl", value)}
                      value={data.clientLogoUrl}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={data.hideClient}
                      onCheckedChange={(checked) =>
                        updateData("hideClient", checked === true)
                      }
                    />
                    Скрыть клиента по NDA
                  </label>
                </div>
                <div className="space-y-2">
                  <RequiredLabel required>Публиковать от имени</RequiredLabel>
                  <Select onValueChange={setOwner} value={owner}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите владельца" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map((item) => (
                        <SelectItem
                          key={`${item.owner_type}:${item.owner_id}`}
                          value={`${item.owner_type}:${item.owner_id}`}
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 1 ? (
            <Card>
              <CardHeader>
                <CardTitle>Задача и решение</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="intro-media">
                    Вступительная картинка или видео
                  </RequiredLabel>
                  <Input
                    id="intro-media"
                    onChange={(event) =>
                      updateData("introMediaUrl", event.target.value)
                    }
                    placeholder={
                      coverUrl
                        ? "По умолчанию используется обложка"
                        : "Ссылка на изображение или видео"
                    }
                    value={data.introMediaUrl}
                  />
                  <p className="text-xs text-muted-foreground">
                    YouTube, Rutube, Vimeo, VK, Kinescope или Boomstream.
                  </p>
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="case-task" required>
                    Задача
                  </RequiredLabel>
                  <RichTextField
                    id="case-task"
                    onChange={(value) => updateData("task", value)}
                    placeholder="Что требовалось сделать"
                    value={data.task}
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="case-solution" required>
                    Решение
                  </RequiredLabel>
                  <RichTextField
                    id="case-solution"
                    onChange={(value) => updateData("solution", value)}
                    placeholder="Как команда подошла к задаче"
                    value={data.solution}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Результат</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="case-result" required>
                      Результат
                    </RequiredLabel>
                    <RichTextField
                      id="case-result"
                      onChange={(value) => updateData("result", value)}
                      placeholder="Результаты, цифры и эффект проекта"
                      value={data.result}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <RequiredLabel htmlFor="team-comment">
                        Комментарий или вопрос от команды
                      </RequiredLabel>
                      <Textarea
                        id="team-comment"
                        onChange={(event) =>
                          updateData("teamComment", event.target.value)
                        }
                        value={data.teamComment}
                      />
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="team-comment-author">
                        Кто задаёт
                      </RequiredLabel>
                      <Input
                        id="team-comment-author"
                        onChange={(event) =>
                          updateData("teamCommentAuthor", event.target.value)
                        }
                        placeholder="Имя и роль"
                        value={data.teamCommentAuthor}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Команда проекта</CardTitle>
                  <Button
                    onClick={addTeamMember}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Plus /> Добавить
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.team.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Участники пока не добавлены.
                    </p>
                  ) : null}
                  {data.team.map((member) => (
                    <div
                      className="grid gap-3 rounded-lg border p-4 md:grid-cols-[auto_1fr_1fr_1fr_auto]"
                      key={member.id}
                    >
                      <MaterialImageUpload
                        label="Фото участника"
                        onChange={(photoUrl) =>
                          updateData(
                            "team",
                            data.team.map((item) =>
                              item.id === member.id
                                ? { ...item, photoUrl }
                                : item,
                            ),
                          )
                        }
                        value={member.photoUrl}
                      />
                      <Input
                        aria-label="ФИО"
                        onChange={(event) =>
                          updateData(
                            "team",
                            data.team.map((item) =>
                              item.id === member.id
                                ? { ...item, name: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="ФИО"
                        value={member.name}
                      />
                      <Input
                        aria-label="Должность"
                        onChange={(event) =>
                          updateData(
                            "team",
                            data.team.map((item) =>
                              item.id === member.id
                                ? { ...item, position: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Должность"
                        value={member.position}
                      />
                      <Input
                        aria-label="Компания"
                        onChange={(event) =>
                          updateData(
                            "team",
                            data.team.map((item) =>
                              item.id === member.id
                                ? { ...item, company: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Компания"
                        value={member.company}
                      />
                      <Button
                        aria-label="Удалить участника"
                        onClick={() =>
                          updateData(
                            "team",
                            data.team.filter((item) => item.id !== member.id),
                          )
                        }
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Награды</CardTitle>
                  <Button
                    onClick={addAward}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Plus /> Добавить
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.awards.map((award) => (
                    <div
                      className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                      key={award.id}
                    >
                      <Input
                        aria-label="Название награды"
                        onChange={(event) =>
                          updateData(
                            "awards",
                            data.awards.map((item) =>
                              item.id === award.id
                                ? { ...item, title: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Название конкурса или награды"
                        value={award.title}
                      />
                      <Input
                        aria-label="Ссылка на награду"
                        onChange={(event) =>
                          updateData(
                            "awards",
                            data.awards.map((item) =>
                              item.id === award.id
                                ? { ...item, url: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="https://"
                        value={award.url}
                      />
                      <Button
                        aria-label="Удалить награду"
                        onClick={() =>
                          updateData(
                            "awards",
                            data.awards.filter((item) => item.id !== award.id),
                          )
                        }
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Готовность</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-semibold">{quality}%</span>
                <span className="text-xs text-muted-foreground">заполнено</span>
              </div>
              <Progress className="mt-3" value={quality} />
              {missing.length > 0 ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Для модерации: {missing.join(", ")}.
                </p>
              ) : (
                <p className="mt-4 text-sm text-primary">
                  Кейс готов к модерации.
                </p>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-2">
            <Button
              onClick={() => prepareSubmit("save")}
              type="submit"
              variant="outline"
            >
              <Check /> Сохранить черновик
            </Button>
            <Button
              disabled={missing.length > 0}
              onClick={() => prepareSubmit("moderate")}
              type="submit"
            >
              <Send /> На модерацию
            </Button>
            {draftId && (material?.status ?? "draft") === "draft" ? (
              <Button
                onClick={() => {
                  if (window.confirm("Удалить черновик?")) {
                    prepareSubmit("delete")
                    formRef.current?.requestSubmit()
                  }
                }}
                type="button"
                variant="destructive"
              >
                <Trash2 /> Удалить
              </Button>
            ) : null}
          </div>
        </aside>
      </div>

      <Dialog onOpenChange={setPreviewOpen} open={previewOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title || "Новый кейс"}</DialogTitle>
            <DialogDescription>
              {description || "Описание появится из блока «О проекте»."}
            </DialogDescription>
          </DialogHeader>
          <MaterialPreview document={document} />
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setCloseOpen} open={closeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Закрыть редактор?</DialogTitle>
            <DialogDescription>
              Сохраните черновик или удалите введённые данные.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setCloseOpen(false)}
              type="button"
              variant="ghost"
            >
              Продолжить
            </Button>
            {canDeleteDraft ? (
              <Button
                onClick={() => void discardAndClose()}
                type="button"
                variant="destructive"
              >
                Удалить
              </Button>
            ) : null}
            <Button
              onClick={() => {
                prepareSubmit("save")
                formRef.current?.requestSubmit()
              }}
              type="button"
            >
              Сохранить черновик
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
