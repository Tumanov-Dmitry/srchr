import { createEvent, updateEvent } from "@/app/actions/events"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"
import type { Event, ExpertProfile, OrganizationMember } from "@/types"

const eventTypes = [
  ["conference", "Конференция"],
  ["meetup", "Митап"],
  ["webinar", "Вебинар"],
  ["workshop", "Воркшоп"],
  ["education", "Обучение"],
  ["exhibition", "Выставка"],
  ["private_meeting", "Закрытая встреча"],
  ["other", "Другое"],
]

const formats = [
  ["offline", "Офлайн"],
  ["online", "Онлайн"],
  ["hybrid", "Гибрид"],
]

const prices = [
  ["free", "Бесплатно"],
  ["paid", "Платно"],
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
  const defaultOwner = event
    ? `${event.owner_type}:${event.owner_id}`
    : expert?.id
      ? `expert:${expert.id}`
      : organizationOwners[0]?.organizations?.id
        ? `organization:${organizationOwners[0].organizations.id}`
        : ""

  return (
    <form action={action} className="space-y-6">
      {event ? <input name="id" type="hidden" value={event.id} /> : null}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <RequiredLabel htmlFor="title" required>
              Название
            </RequiredLabel>
            <Input defaultValue={event?.title ?? ""} id="title" name="title" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <RequiredLabel htmlFor="description" required>
              Описание
            </RequiredLabel>
            <Textarea
              defaultValue={event?.description ?? ""}
              id="description"
              name="description"
              rows={7}
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="owner" required>
              Владелец
            </RequiredLabel>
            {admin && event ? (
              <>
                <input name="owner" type="hidden" value={`${event.owner_type}:${event.owner_id}`} />
                <div className="rounded-md border bg-secondary px-3 py-2 text-sm">
                  {event.owner_name ?? `${event.owner_type}: ${event.owner_id}`}
                </div>
              </>
            ) : (
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue={defaultOwner}
                id="owner"
                name="owner"
              >
                <option value="">Выберите владельца</option>
                {expert ? (
                  <option value={`expert:${expert.id}`}>
                    Эксперт: {[expert.first_name, expert.last_name].filter(Boolean).join(" ")}
                  </option>
                ) : null}
                {organizationOwners.map((membership) => {
                  const organization = membership.organizations
                  const organizationId =
                    membership.organization_id ?? membership.org_id ?? organization?.id

                  if (!organizationId) return null

                  return (
                    <option key={organizationId} value={`organization:${organizationId}`}>
                      Организация: {organization?.name ?? organizationId}
                    </option>
                  )
                })}
              </select>
            )}
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="event_type" required>
              Тип
            </RequiredLabel>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={event?.event_type ?? "other"}
              id="event_type"
              name="event_type"
            >
              {eventTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="start_date" required>
              Дата начала
            </RequiredLabel>
            <Input
              defaultValue={toLocalDatetime(event?.start_date)}
              id="start_date"
              name="start_date"
              type="datetime-local"
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="end_date">Дата окончания</RequiredLabel>
            <Input
              defaultValue={toLocalDatetime(event?.end_date)}
              id="end_date"
              name="end_date"
              type="datetime-local"
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="format" required>
              Формат
            </RequiredLabel>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={event?.format ?? "offline"}
              id="format"
              name="format"
            >
              {formats.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="price_type">Стоимость</RequiredLabel>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={event?.price_type ?? "free"}
              id="price_type"
              name="price_type"
            >
              {prices.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Детали</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <RequiredLabel htmlFor="city">Город</RequiredLabel>
            <Input defaultValue={event?.city ?? ""} id="city" name="city" />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="address">Адрес</RequiredLabel>
            <Input defaultValue={event?.address ?? ""} id="address" name="address" />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="cover_url">Обложка URL</RequiredLabel>
            <Input defaultValue={event?.cover_url ?? ""} id="cover_url" name="cover_url" />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="external_url">Ссылка регистрации</RequiredLabel>
            <Input
              defaultValue={event?.external_url ?? ""}
              id="external_url"
              name="external_url"
              type="url"
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="price_note">Описание стоимости</RequiredLabel>
            <Input
              defaultValue={event?.price_note ?? ""}
              id="price_note"
              name="price_note"
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="speakers">Спикеры</RequiredLabel>
            <Input
              defaultValue={event?.speakers ?? ""}
              id="speakers"
              name="speakers"
              placeholder="Через запятую"
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="categories">Категории</RequiredLabel>
            <Input
              defaultValue={event?.categories ?? ""}
              id="categories"
              name="categories"
              placeholder="Через запятую"
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="tags">Теги</RequiredLabel>
            <Input
              defaultValue={event?.tags ?? ""}
              id="tags"
              name="tags"
              placeholder="Через запятую"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {admin ? null : (
          <>
            <Button name="status" type="submit" value="draft" variant="outline">
              Сохранить черновик
            </Button>
            <Button name="status" type="submit" value="moderation">
              Отправить на модерацию
            </Button>
          </>
        )}
        {mode === "edit" && !admin ? (
          <>
            <Button name="intent" type="submit" value="archive" variant="outline">
              Архивировать
            </Button>
            <Button name="intent" type="submit" value="cancel" variant="destructive">
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
