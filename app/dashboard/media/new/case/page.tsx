import { createCaseMaterial } from "@/app/actions/media"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default async function NewCaseMaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <form action={createCaseMaterial} className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field name="title" label="Название кейса" required />
          <Field name="cover_url" label="Обложка" placeholder="https://..." />
          <TextField name="description" label="Короткое описание" className="md:col-span-2" required />
          <Field name="category" label="Категория / услуга" required />
          <Field name="industry" label="Индустрия клиента" required />
          <Field name="city" label="Город / регион" />
          <Field name="project_year" label="Год проекта" type="number" />
          <Field name="client_name" label="Клиент / бренд" />
          <Field name="client_url" label="Ссылка на сайт клиента" placeholder="https://..." />
          <div className="space-y-2">
            <Label htmlFor="client_name_visible">Показывать название клиента</Label>
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
          <TextField name="task" label="Задача" required />
          <TextField name="context" label="Контекст" />
          <TextField name="work_done" label="Что сделали" required />
          <TextField name="project_team" label="Команда проекта" />
          <TextField name="solution" label="Решение" />
          <TextField name="result" label="Результат" required />
          <TextField name="metrics" label="Цифры / метрики" />
          <TextField name="client_review" label="Отзыв клиента" />
          <TextField name="gallery" label="Галерея / медиа" placeholder="Ссылки на изображения или видео, по одной в строке" />
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
          <Field name="tags" label="Теги" placeholder="HR-брендинг, EVP, исследование" />
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
    </form>
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
      <Label htmlFor={name}>{label}</Label>
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
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} {...props} />
    </div>
  )
}
