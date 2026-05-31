import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { updateMaterial } from "@/app/actions/media"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"
import { getDashboardMaterialById } from "@/lib/supabase/queries"
import type { Material } from "@/types"

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликован",
  rejected: "Отклонен",
  archived: "Архив",
}

type ContentBlock = {
  type?: string
  content?: string | null
}

type MaterialContent = {
  blocks?: ContentBlock[]
  meta?: Record<string, string | number | null>
}

export default async function EditMaterialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const { id } = await params
  const { message } = await searchParams
  const { user, material, isMaterialsTableMissing } =
    await getDashboardMaterialById(id)

  if (!user) redirect("/login")
  if (isMaterialsTableMissing) redirect("/dashboard/media")
  if (!material) notFound()

  const content = parseContent(material)

  return (
    <form action={updateMaterial} className="space-y-6">
      <input name="id" type="hidden" value={material.id} />
      <input name="type" type="hidden" value={material.type} />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {material.type === "case" ? "Кейс" : "Статья"}
            </Badge>
            <Badge>{statusLabels[material.status ?? ""] ?? "Без статуса"}</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">
            Редактировать материал
          </h1>
          <p className="mt-2 text-muted-foreground">
            Черновики можно дополнять и отправлять на модерацию. Текущий статус
            виден в списке материалов.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/media">К списку</Link>
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {message}
        </div>
      ) : null}

      {material.type === "case" ? (
        <CaseFields content={content} material={material} />
      ) : (
        <ArticleFields content={content} material={material} />
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="status" value="draft" variant="outline">
          Сохранить черновик
        </Button>
        <Button type="submit" name="status" value="moderation">
          Отправить на модерацию
        </Button>
      </div>
    </form>
  )
}

function CaseFields({
  content,
  material,
}: {
  content: MaterialContent
  material: Material
}) {
  const meta = content.meta ?? {}

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field defaultValue={material.title} label="Название кейса" name="title" requiredLabel />
          <Field defaultValue={material.cover_url ?? ""} label="Обложка" name="cover_url" placeholder="https://..." />
          <TextField className="md:col-span-2" defaultValue={material.description ?? ""} label="Короткое описание" name="description" requiredLabel />
          <Field defaultValue={material.category ?? stringValue(meta.category)} label="Категория / услуга" name="category" requiredLabel />
          <Field defaultValue={stringValue(meta.industry)} label="Индустрия клиента" name="industry" requiredLabel />
          <Field defaultValue={stringValue(meta.city)} label="Город / регион" name="city" />
          <Field defaultValue={stringValue(meta.project_year)} label="Год проекта" name="project_year" type="number" />
          <Field defaultValue={stringValue(meta.client_name)} label="Клиент / бренд" name="client_name" />
          <Field defaultValue={stringValue(meta.client_url)} label="Ссылка на сайт клиента" name="client_url" placeholder="https://..." />
          <div className="space-y-2">
            <Label htmlFor="client_name_visible">Показывать название клиента</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={stringValue(meta.client_name_visible) || "yes"}
              id="client_name_visible"
              name="client_name_visible"
            >
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Содержание кейса</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <TextField defaultValue={blockValue(content, "task")} label="Задача" name="task" requiredLabel />
          <TextField defaultValue={blockValue(content, "context")} label="Контекст" name="context" />
          <TextField defaultValue={blockValue(content, "work")} label="Что сделали" name="work_done" requiredLabel />
          <TextField defaultValue={blockValue(content, "team")} label="Команда проекта" name="project_team" />
          <TextField defaultValue={blockValue(content, "solution")} label="Решение" name="solution" />
          <TextField defaultValue={blockValue(content, "result")} label="Результат" name="result" requiredLabel />
          <TextField defaultValue={blockValue(content, "metrics")} label="Цифры / метрики" name="metrics" />
          <TextField defaultValue={blockValue(content, "review")} label="Отзыв клиента" name="client_review" />
          <TextField defaultValue={blockValue(content, "gallery")} label="Галерея / медиа" name="gallery" placeholder="Ссылки на изображения или видео, по одной в строке" />
          <TextField defaultValue={blockValue(content, "links")} label="Ссылки на результат" name="result_links" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Связанные данные</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field defaultValue={stringValue(meta.services)} label="Какие услуги были оказаны" name="services" />
          <Field defaultValue={stringValue(meta.specialists)} label="Какие специалисты участвовали" name="specialists" />
          <Field defaultValue={stringValue(meta.tools)} label="Какие инструменты использовались" name="tools" />
          <Field defaultValue={stringValue(meta.project_duration)} label="Срок проекта" name="project_duration" />
          <Field defaultValue={stringValue(meta.budget_range)} label="Бюджетный диапазон" name="budget_range" />
          <Field defaultValue={material.tags ?? stringValue(meta.tags)} label="Теги" name="tags" placeholder="HR-брендинг, EVP, исследование" />
        </CardContent>
      </Card>
    </>
  )
}

function ArticleFields({
  content,
  material,
}: {
  content: MaterialContent
  material: Material
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field defaultValue={material.title} label="Название статьи" name="title" requiredLabel />
          <Field defaultValue={material.cover_url ?? ""} label="Обложка" name="cover_url" placeholder="https://..." />
          <TextField className="md:col-span-2" defaultValue={material.description ?? ""} label="Короткое описание" name="description" requiredLabel />
          <Field defaultValue={material.author ?? ""} label="Автор" name="author" />
          <Field defaultValue={material.category ?? ""} label="Рубрика" name="category" requiredLabel />
          <Field defaultValue={material.tags ?? ""} label="Теги" name="tags" placeholder="гайд, EVP, подборка" requiredLabel />
          <Field defaultValue={stringValue(material.reading_time)} label="Время чтения, мин" name="reading_time" type="number" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Контент</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <TextField defaultValue={blockValue(content, "text")} label="Основной текст" name="content" requiredLabel />
          <TextField defaultValue={blockValue(content, "quote")} label="Цитата" name="quote" />
          <TextField defaultValue={blockValue(content, "cta")} label="CTA-блок" name="cta" />
        </CardContent>
      </Card>
    </>
  )
}

function parseContent(material: Material): MaterialContent {
  if (!material.content) return {}
  if (typeof material.content === "object") return material.content as MaterialContent

  try {
    return JSON.parse(material.content) as MaterialContent
  } catch {
    return {}
  }
}

function blockValue(content: MaterialContent, type: string) {
  return content.blocks?.find((block) => block.type === type)?.content ?? ""
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value)
}

function Field({
  name,
  label,
  requiredLabel = false,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; requiredLabel?: boolean }) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name} required={requiredLabel}>
        {label}
      </RequiredLabel>
      <Input id={name} name={name} {...props} />
    </div>
  )
}

function TextField({
  name,
  label,
  requiredLabel = false,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & { label: string; requiredLabel?: boolean }) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name} required={requiredLabel}>
        {label}
      </RequiredLabel>
      <Textarea id={name} name={name} {...props} />
    </div>
  )
}
