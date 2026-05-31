import { createArticleMaterial } from "@/app/actions/media"
import { AutosaveForm } from "@/components/media/autosave-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"

export default async function NewArticleMaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <AutosaveForm
      action={createArticleMaterial}
      className="space-y-6"
      storageKey="srchr:material:article:draft"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Создать статью</h1>
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

      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field name="title" label="Название статьи" required />
          <Field name="cover_url" label="Обложка" placeholder="https://..." />
          <TextField name="description" label="Короткое описание" className="md:col-span-2" required />
          <Field name="author" label="Автор" />
          <Field name="category" label="Рубрика" required />
          <Field name="tags" label="Теги" placeholder="гайд, EVP, подборка" required />
          <Field name="reading_time" label="Время чтения, мин" type="number" />
          <Field name="published_at" label="Дата публикации" type="date" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Контент</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <TextField name="content" label="Основной текст" required />
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
  className,
  ...props
}: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name} required={Boolean(props.required)}>
        {label}
      </RequiredLabel>
      <Input id={name} name={name} {...props} />
    </div>
  )
}

function TextField({
  name,
  label,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & { label: string }) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name} required={Boolean(props.required)}>
        {label}
      </RequiredLabel>
      <Textarea id={name} name={name} {...props} />
    </div>
  )
}
