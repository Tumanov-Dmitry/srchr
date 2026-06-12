import { redirect } from "next/navigation"
import { createArticleMaterial } from "@/app/actions/media"
import { AutosaveForm } from "@/components/media/autosave-form"
import { MaterialOwnerSelect } from "@/components/media/material-owner-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"
import { decodeMessage } from "@/lib/messages"
import { getUserContentOwners } from "@/lib/supabase/queries"

export default async function NewArticleMaterialPage({
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
      action={createArticleMaterial}
      className="space-y-6"
      storageKey="srchr:material:article:draft"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">
          Создать статью
        </h1>
        <p className="mt-2 text-muted-foreground">
          Подготовьте экспертный материал: гайд, обзор рынка, исследование,
          подборку или мнение.
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
          <Field name="title" label="Название статьи" requiredLabel />
          <Field name="cover_url" label="Обложка" placeholder="https://..." />
          <TextField
            name="description"
            label="Короткое описание"
            className="md:col-span-2"
            requiredLabel
          />
          <Field name="author" label="Автор" />
          <Field name="category" label="Рубрика" requiredLabel />
          <Field
            name="tags"
            label="Теги"
            placeholder="гайд, EVP, подборка"
            requiredLabel
          />
          <Field name="reading_time" label="Время чтения, мин" type="number" />
          <Field name="published_at" label="Дата публикации" type="date" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Контент</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <TextField name="content" label="Основной текст" requiredLabel />
          <TextField name="quote" label="Цитата" />
          <TextField name="cta" label="CTA-блок" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Связи</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field name="service" label="Связанная услуга" />
          <Field name="case_slug" label="Связанный кейс" />
          <Field name="collection" label="Подборка" />
          <Field name="topic" label="Тема / тег" />
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
  name: string
  requiredLabel?: boolean
}) {
  const isNumber = props.type === "number"
  const isDate = props.type === "date"

  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name} required={requiredLabel}>
        {label}
      </RequiredLabel>
      {isNumber ? (
        <NumberInput
          defaultValue={props.defaultValue as string | number | undefined}
          id={name}
          name={name}
        />
      ) : isDate ? (
        <DatePicker
          defaultValue={String(props.defaultValue ?? "")}
          name={name}
        />
      ) : (
        <Input id={name} name={name} {...props} />
      )}
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
