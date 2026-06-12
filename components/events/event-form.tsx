import { createEvent, updateEvent } from "@/app/actions/events"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DateTimePicker } from "@/components/ui/date-picker"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"
import type { Event, ExpertProfile, OrganizationMember } from "@/types"

const eventTypes = [
  { value: "conference", label: "Конференция" },
  { value: "meetup", label: "Митап" },
  { value: "webinar", label: "Вебинар" },
  { value: "workshop", label: "Воркшоп" },
  { value: "education", label: "Обучение" },
  { value: "exhibition", label: "Выставка" },
  { value: "private_meeting", label: "Закрытая встреча" },
  { value: "other", label: "Другое" },
]

function toLocalDatetime(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function EventForm({
  event,
  expert,
  memberships,
  mode,
  admin = false,
}: {
  event?: Event | null
  expert?: ExpertProfile | null
  memberships: OrganizationMember[]
  mode: "create" | "edit"
  admin?: boolean
}) {
  const action = mode === "create" ? createEvent : updateEvent
  const organizationOwners = memberships.filter((membership) =>
    ["owner", "admin", "editor"].includes(membership.role ?? "member"),
  )
  const ownerOptions = [
    ...(expert
      ? [
          {
            value: `expert:${expert.id}`,
            label: `Эксперт: ${[expert.first_name, expert.last_name]
              .filter(Boolean)
              .join(" ")}`,
          },
        ]
      : []),
    ...organizationOwners.flatMap((membership) => {
      const organization = membership.organizations
      const organizationId =
        membership.organization_id ?? membership.org_id ?? organization?.id
      return organizationId
        ? [
            {
              value: `organization:${organizationId}`,
              label: `Организация: ${organization?.name ?? organizationId}`,
            },
          ]
        : []
    }),
  ]
  const defaultOwner = event
    ? `${event.owner_type}:${event.owner_id}`
    : (ownerOptions[0]?.value ?? undefined)

  return (
    <form action={action} className="space-y-6">
      {event ? <input name="id" type="hidden" value={event.id} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field
            className="md:col-span-2"
            defaultValue={event?.title ?? ""}
            label="Название"
            name="title"
            required
          />
          <TextField
            className="md:col-span-2"
            defaultValue={event?.description ?? ""}
            label="Описание"
            name="description"
            required
            rows={7}
          />
          <div className="space-y-2">
            <RequiredLabel htmlFor="owner" required>
              Владелец
            </RequiredLabel>
            {admin && event ? (
              <>
                <input
                  name="owner"
                  type="hidden"
                  value={`${event.owner_type}:${event.owner_id}`}
                />
                <Alert>
                  <AlertDescription>
                    {event.owner_name ??
                      `${event.owner_type}: ${event.owner_id}`}
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <FormSelect
                defaultValue={defaultOwner}
                name="owner"
                options={ownerOptions}
                placeholder="Выберите владельца"
              />
            )}
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="event_type" required>
              Тип
            </RequiredLabel>
            <FormSelect
              defaultValue={event?.event_type ?? "other"}
              name="event_type"
              options={eventTypes}
            />
          </div>
          <Field
            defaultValue={toLocalDatetime(event?.start_date)}
            label="Дата начала"
            name="start_date"
            required
            type="datetime-local"
          />
          <Field
            defaultValue={toLocalDatetime(event?.end_date)}
            label="Дата окончания"
            name="end_date"
            type="datetime-local"
          />
          <div className="space-y-2">
            <RequiredLabel htmlFor="format" required>
              Формат
            </RequiredLabel>
            <FormSelect
              defaultValue={event?.format ?? "offline"}
              name="format"
              options={[
                { value: "offline", label: "Офлайн" },
                { value: "online", label: "Онлайн" },
                { value: "hybrid", label: "Гибрид" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="price_type">Стоимость</RequiredLabel>
            <FormSelect
              defaultValue={event?.price_type ?? "free"}
              name="price_type"
              options={[
                { value: "free", label: "Бесплатно" },
                { value: "paid", label: "Платно" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Детали</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field defaultValue={event?.city ?? ""} label="Город" name="city" />
          <Field
            defaultValue={event?.address ?? ""}
            label="Адрес"
            name="address"
          />
          <Field
            defaultValue={event?.cover_url ?? ""}
            label="Обложка URL"
            name="cover_url"
          />
          <Field
            defaultValue={event?.external_url ?? ""}
            label="Ссылка регистрации"
            name="external_url"
            type="url"
          />
          <Field
            defaultValue={event?.price_note ?? ""}
            label="Описание стоимости"
            name="price_note"
          />
          <Field
            defaultValue={event?.speakers ?? ""}
            label="Спикеры"
            name="speakers"
            placeholder="Через запятую"
          />
          <Field
            defaultValue={event?.categories ?? ""}
            label="Категории"
            name="categories"
            placeholder="Через запятую"
          />
          <Field
            defaultValue={event?.tags ?? ""}
            label="Теги"
            name="tags"
            placeholder="Через запятую"
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {!admin ? (
          <>
            <Button name="status" type="submit" value="draft" variant="outline">
              Сохранить черновик
            </Button>
            <Button name="status" type="submit" value="moderation">
              Отправить на модерацию
            </Button>
          </>
        ) : null}
        {mode === "edit" && !admin ? (
          <>
            <Button
              name="intent"
              type="submit"
              value="archive"
              variant="outline"
            >
              Архивировать
            </Button>
            <Button
              name="intent"
              type="submit"
              value="cancel"
              variant="destructive"
            >
              Отменить
            </Button>
          </>
        ) : null}
        {admin ? (
          <Button name="status" type="submit" value={event?.status ?? "draft"}>
            Сохранить изменения
          </Button>
        ) : null}
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  required,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  name: string
}) {
  const isDateTime = props.type === "datetime-local"

  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name} required={required}>
        {label}
      </RequiredLabel>
      {isDateTime ? (
        <DateTimePicker
          defaultValue={String(props.defaultValue ?? "")}
          name={name}
          required={required}
        />
      ) : (
        <Input id={name} name={name} required={required} {...props} />
      )}
    </div>
  )
}

function TextField({
  name,
  label,
  required,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  label: string
  name: string
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name} required={required}>
        {label}
      </RequiredLabel>
      <Textarea id={name} name={name} required={required} {...props} />
    </div>
  )
}
