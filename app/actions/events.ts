"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { encodeMessage } from "@/lib/messages"
import {
  createNotificationEvent,
  notifyAdmins,
} from "@/lib/notifications"
import { createSlug } from "@/lib/slug"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAdminAccess } from "@/lib/supabase/admin-queries"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentExpertProfile,
  getCurrentUser,
  getUserOrganizationMemberships,
} from "@/lib/supabase/queries"
import type {
  EventFormat,
  EventOwnerType,
  EventParticipationStatus,
  EventPriceType,
  EventStatus,
  EventType,
} from "@/types"

type PayloadValue = string | boolean | null

const eventTypes: EventType[] = [
  "conference",
  "meetup",
  "webinar",
  "workshop",
  "education",
  "exhibition",
  "private_meeting",
  "other",
]

const eventFormats: EventFormat[] = ["online", "offline", "hybrid"]
const priceTypes: EventPriceType[] = ["free", "paid"]
const eventStatuses: EventStatus[] = [
  "draft",
  "moderation",
  "archived",
  "cancelled",
]
const participationStatuses: EventParticipationStatus[] = [
  "going",
  "interested",
  "not_going",
]

function value(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim()
  return raw.length > 0 ? raw : null
}

function safeValue<T extends string>(valueToCheck: string | null, allowed: T[], fallback: T) {
  return valueToCheck && allowed.includes(valueToCheck as T) ? (valueToCheck as T) : fallback
}

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeMessage(message)}`)
}

async function createWriterClient() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : await createClient()
}

async function getAvailableSlug(title: string, currentId?: string | null) {
  const supabase = await createWriterClient()
  const baseSlug = createSlug(title)
  let candidate = baseSlug

  for (let index = 0; index < 20; index += 1) {
    const { data } = await supabase
      .from("events")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()

    if (!data || data.id === currentId) return candidate
    candidate = `${baseSlug}-${index + 2}`
  }

  return `${baseSlug}-${Date.now().toString(36)}`
}

function parseOwner(owner: string | null) {
  const [ownerType, ownerId] = (owner ?? "").split(":")

  if ((ownerType === "expert" || ownerType === "organization") && ownerId) {
    return {
      owner_type: ownerType as EventOwnerType,
      owner_id: ownerId,
    }
  }

  return null
}

async function getAllowedOwners(userId: string) {
  const memberships = await getUserOrganizationMemberships(userId)
  const expert = await getCurrentExpertProfile()
  const owners: Array<{ owner_type: EventOwnerType; owner_id: string }> = []

  if (expert.profile?.id) {
    owners.push({ owner_type: "expert", owner_id: expert.profile.id })
  }

  memberships
    .filter((membership) => ["owner", "admin", "editor"].includes(membership.role ?? "member"))
    .forEach((membership) => {
      const organizationId =
        membership.organization_id ?? membership.org_id ?? membership.organizations?.id

      if (organizationId) {
        owners.push({ owner_type: "organization", owner_id: organizationId })
      }
    })

  return owners
}

async function canUseOwner(
  userId: string,
  ownerType: EventOwnerType,
  ownerId: string,
) {
  const adminAccess = await getAdminAccess()
  if (adminAccess.isAdmin) return true

  const owners = await getAllowedOwners(userId)

  return owners.some(
    (owner) => owner.owner_type === ownerType && owner.owner_id === ownerId,
  )
}

async function canEditEvent(userId: string, eventId: string) {
  const adminAccess = await getAdminAccess()
  if (adminAccess.isAdmin) return true

  const supabase = await createWriterClient()
  const { data, error } = await supabase
    .from("events")
    .select("id, owner_type, owner_id, created_by, status")
    .eq("id", eventId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return false

  if (data.created_by === userId) return true

  return canUseOwner(userId, data.owner_type as EventOwnerType, data.owner_id as string)
}

function eventPayload(
  formData: FormData,
  owner: { owner_type: EventOwnerType; owner_id: string },
  userId: string,
  status: EventStatus,
  slug: string,
) {
  return {
    title: value(formData, "title") ?? "Новое событие",
    slug,
    description: value(formData, "description"),
    cover_url: value(formData, "cover_url"),
    event_type: safeValue(value(formData, "event_type"), eventTypes, "other"),
    start_date: value(formData, "start_date"),
    end_date: value(formData, "end_date"),
    city: value(formData, "city"),
    address: value(formData, "address"),
    format: safeValue(value(formData, "format"), eventFormats, "offline"),
    external_url: value(formData, "external_url"),
    price_type: safeValue(value(formData, "price_type"), priceTypes, "free"),
    price_note: value(formData, "price_note"),
    owner_type: owner.owner_type,
    owner_id: owner.owner_id,
    speakers: value(formData, "speakers"),
    tags: value(formData, "tags"),
    categories: value(formData, "categories"),
    status,
    created_by: userId,
    updated_at: new Date().toISOString(),
    published_at: null,
  } satisfies Record<string, PayloadValue>
}

function requireModerationFields(formData: FormData, path: string) {
  const required = ["title", "description", "start_date", "event_type", "format"]
  const missing = required.filter((field) => !value(formData, field))

  if (missing.length > 0) {
    redirectWithMessage(path, "Заполните обязательные поля для отправки на модерацию")
  }
}

export async function createEvent(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const status = safeValue(value(formData, "status"), eventStatuses, "draft")
  const owner = parseOwner(value(formData, "owner"))
  const path = "/dashboard/events/new"

  if (!owner || !(await canUseOwner(user.id, owner.owner_type, owner.owner_id))) {
    redirectWithMessage(path, "Выберите экспертный профиль или организацию-владельца")
  }

  if (status === "moderation") {
    requireModerationFields(formData, path)
  }

  const title = value(formData, "title") ?? "Новое событие"
  const slug = await getAvailableSlug(title)
  const supabase = await createWriterClient()
  const payload = eventPayload(formData, owner, user.id, status, slug)

  const { data: createdEvent, error } = await supabase
    .from("events")
    .insert(payload)
    .select("id, slug, title, status")
    .maybeSingle()

  if (error) redirectWithMessage(path, error.message)

  if (createdEvent && status === "moderation") {
    await createNotificationEvent({
      event_key: "event_moderation_requested",
      event_type: "event_moderation_requested",
      source: "events",
      actor_id: user.id,
      target_type: "event",
      target_id: createdEvent.id as string,
      title: "Новое мероприятие на модерации",
      text: createdEvent.title as string,
    })
    await notifyAdmins({
      title: "Новое мероприятие на модерации",
      text: createdEvent.title as string,
      type: "admin",
      target_type: "event",
      target_id: createdEvent.id as string,
      target_url: `/admin/events/${createdEvent.id}/edit`,
    })
  }

  revalidatePath("/dashboard/events")
  redirectWithMessage("/dashboard/events", "Событие сохранено")
}

export async function updateEvent(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const id = value(formData, "id")
  const intent = value(formData, "intent") ?? "save"
  const path = id ? `/dashboard/events/${id}/edit` : "/dashboard/events"

  if (!id) redirectWithMessage("/dashboard/events", "Событие не найдено")
  if (!(await canEditEvent(user.id, id))) {
    redirectWithMessage(path, "Нет доступа к этому событию")
  }

  if (intent === "archive") {
    const supabase = await createWriterClient()
    const { error } = await supabase
      .from("events")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) redirectWithMessage(path, error.message)
    revalidatePath("/dashboard/events")
    redirectWithMessage("/dashboard/events", "Событие отправлено в архив")
  }

  if (intent === "cancel") {
    const supabase = await createWriterClient()
    const { error } = await supabase
      .from("events")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) redirectWithMessage(path, error.message)
    revalidatePath("/dashboard/events")
    redirectWithMessage("/dashboard/events", "Событие отменено")
  }

  const status = safeValue(value(formData, "status"), eventStatuses, "draft")
  const owner = parseOwner(value(formData, "owner"))

  if (!owner || !(await canUseOwner(user.id, owner.owner_type, owner.owner_id))) {
    redirectWithMessage(path, "Выберите экспертный профиль или организацию-владельца")
  }

  if (status === "moderation") {
    requireModerationFields(formData, path)
  }

  const title = value(formData, "title") ?? "Новое событие"
  const slug = await getAvailableSlug(title, id)
  const supabase = await createWriterClient()
  const payload = eventPayload(
    formData,
    owner,
    user.id,
    status,
    slug,
  )
  delete (payload as Partial<typeof payload>).created_by

  const { error } = await supabase.from("events").update(payload).eq("id", id)

  if (error) redirectWithMessage(path, error.message)

  if (status === "moderation") {
    await createNotificationEvent({
      event_key: "event_moderation_requested",
      event_type: "event_moderation_requested",
      source: "events",
      actor_id: user.id,
      target_type: "event",
      target_id: id,
      title: "Мероприятие отправлено на модерацию",
      text: title,
    })
    await notifyAdmins({
      title: "Мероприятие отправлено на модерацию",
      text: title,
      type: "admin",
      target_type: "event",
      target_id: id,
      target_url: `/admin/events/${id}/edit`,
    })
  }

  revalidatePath("/dashboard/events")
  revalidatePath("/events")
  redirectWithMessage("/dashboard/events", "Событие обновлено")
}

export async function setEventParticipation(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const eventId = value(formData, "event_id")
  const slug = value(formData, "slug")
  const status = safeValue(
    value(formData, "status"),
    participationStatuses,
    "interested",
  )
  const path = slug ? `/events/${slug}` : "/events"

  if (!eventId) redirectWithMessage(path, "Событие не найдено")

  const supabase = await createClient()
  const { error } = await supabase.from("event_participants").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,user_id" },
  )

  if (error) redirectWithMessage(path, error.message)

  revalidatePath(path)
  redirectWithMessage(path, "Статус участия обновлен")
}
