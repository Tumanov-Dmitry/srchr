import { savePriceRequest } from "@/app/actions/price-requests"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"
import type { OrganizationMember, PriceRequest } from "@/types"

export function PriceRequestForm({
  request,
  memberships,
}: {
  request?: PriceRequest | null
  memberships: OrganizationMember[]
}) {
  const organizations = memberships
    .filter((membership) =>
      ["owner", "admin", "editor"].includes(membership.role ?? "member"),
    )
    .flatMap((membership) =>
      membership.organizations
        ? [
            {
              value: membership.organizations.id,
              label: membership.organizations.name,
            },
          ]
        : [],
    )

  return (
    <form action={savePriceRequest} className="space-y-6">
      {request ? <input name="id" type="hidden" value={request.id} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Задача и контекст</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field
            className="md:col-span-2"
            defaultValue={request?.title ?? ""}
            label="Название запроса"
            name="title"
            required
          />
          <TextField
            className="md:col-span-2"
            defaultValue={request?.description ?? ""}
            label="Описание проекта"
            name="description"
            rows={7}
          />
          <Field
            defaultValue={request?.service_category ?? ""}
            label="Категория услуги"
            name="service_category"
            placeholder="Например, разработка EVP"
            required
          />
          <Field
            defaultValue={request?.industry ?? ""}
            label="Отрасль"
            name="industry"
            placeholder="IT, ритейл, финансы"
          />
          <Field
            defaultValue={request?.project_scale ?? ""}
            label="Масштаб проекта"
            name="project_scale"
            placeholder="Команда, охват, количество сотрудников"
          />
          <div className="space-y-2">
            <RequiredLabel htmlFor="format">Формат</RequiredLabel>
            <FormSelect
              defaultValue={request?.format ?? "online"}
              name="format"
              options={[
                { value: "online", label: "Онлайн" },
                { value: "offline", label: "Офлайн" },
                { value: "hybrid", label: "Гибрид" },
              ]}
            />
          </div>
          <DateField
            defaultValue={request?.expected_start_date ?? ""}
            label="Ожидаемый старт"
            name="expected_start_date"
          />
          <DateField
            defaultValue={request?.expected_deadline ?? ""}
            label="Желаемый дедлайн"
            name="expected_deadline"
          />
          <Field
            defaultValue={request?.location ?? ""}
            label="Город / регион"
            name="location"
          />
          <div className="space-y-2">
            <RequiredLabel htmlFor="organization_id">
              Организация-заказчик
            </RequiredLabel>
            <FormSelect
              defaultValue={request?.organization_id ?? undefined}
              name="organization_id"
              options={organizations}
              placeholder="Личный запрос"
            />
            <p className="text-xs text-muted-foreground">
              Организация нужна, если позже вы захотите превратить запрос в
              задание.
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button name="intent" type="submit" value="draft" variant="outline">
          Сохранить черновик
        </Button>
        <Button name="intent" type="submit" value="activate">
          Опубликовать запрос
        </Button>
      </div>
    </form>
  )
}

function DateField({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue?: string | null
  className?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={name}>{label}</RequiredLabel>
      <DatePicker defaultValue={defaultValue} name={name} />
    </div>
  )
}

function Field({
  label,
  name,
  required,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  name: string
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name} required={required}>
        {label}
      </RequiredLabel>
      <Input id={name} name={name} required={required} {...props} />
    </div>
  )
}

function TextField({
  label,
  name,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  label: string
  name: string
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name}>{label}</RequiredLabel>
      <Textarea id={name} name={name} {...props} />
    </div>
  )
}
