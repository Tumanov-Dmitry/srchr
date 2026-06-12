import { redirect } from "next/navigation"
import { createCaseMaterial } from "@/app/actions/media"
import { AutosaveForm } from "@/components/media/autosave-form"
import { MaterialOwnerSelect } from "@/components/media/material-owner-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"
import { decodeMessage } from "@/lib/messages"
import { getUserContentOwners } from "@/lib/supabase/queries"

export default async function NewCaseMaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const [{ message: rawMessage }, { user, owners }] = await Promise.all([
    searchParams,
    getUserContentOwners(),
  ])
  if (!user) redirect("/login")
  const message = decodeMessage(rawMessage)

  return (
    <AutosaveForm
      action={createCaseMaterial}
      className="space-y-6"
      storageKey="srchr:material:case:draft"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Создать кейс</h1>
        <p className="mt-2 text-muted-foreground">
          Соберите материал из структурных блоков: задача, процесс, решение и
          результат.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {message}
        </div>
      ) : null}

      <MaterialOwnerSelect owners={owners} />

      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field name="title" label="Название кейса" requiredLabel />
          <Field name="cover_url" label="Обложка" placeholder="https://..." />
          <TextField
            name="description"
            label="Короткое описание"
            className="md:col-span-2"
            requiredLabel
          />
          <Field name="category" label="Категория / услуга" requiredLabel />
          <Field name="industry" label="Индустрия клиента" requiredLabel />
          <Field name="city" label="Город / регион" />
          <Field name="project_year" label="Год проекта" type="number" />
          <Field name="client_name" label="Клиент / бренд" />
          <Field
            name="client_url"
            label="Ссылка на сайт клиента"
            placeholder="https://..."
          />
          <div className="space-y-2">
            <Label htmlFor="client_name_visible">
              Показывать название клиента
            </Label>
            <select
              id="client_name_visible"
              name="client_name_visible"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue="yes"
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
          <TextField name="task" label="Задача" requiredLabel />
          <TextField name="context" label="Контекст" />
          <TextField name="work_done" label="Что сделали" requiredLabel />
          <TextField name="project_team" label="Команда проекта" />
          <TextField name="solution" label="Решение" />
          <TextField name="result" label="Результат" requiredLabel />
          <TextField name="metrics" label="Цифры / метрики" />
          <TextField name="client_review" label="Отзыв клиента" />
          <TextField
            name="gallery"
            label="Галерея / медиа"
            placeholder="Ссылки на изображения или видео, по одной в строке"
          />
          <TextField name="result_links" label="Ссылки на результат" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Связанные данные</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field name="services" label="Какие услуги были оказаны" />
          <Field name="specialists" label="Какие специалисты участвовали" />
          <Field name="tools" label="Какие инструменты использовались" />
          <Field name="project_duration" label="Срок проекта" />
          <Field name="budget_range" label="Бюджетный диапазон" />
          <Field
            name="tags"
            label="Теги"
            placeholder="HR-брендинг, EVP, исследование"
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="status" value="draft" variant="outline">
          Сохранить черновик
        </Button>
        <Button type="submit" name="status" value="moderation">
          Отправить на модерацию
        </Button>
      </div>
    </AutosaveForm>
  )
}

function Field({
  name,
  label,
  requiredLabel = false,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  requiredLabel?: boolean
}) {
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
}: React.ComponentProps<typeof Textarea> & {
  label: string
  requiredLabel?: boolean
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name} required={requiredLabel}>
        {label}
      </RequiredLabel>
      <Textarea id={name} name={name} {...props} />
    </div>
  )
}
