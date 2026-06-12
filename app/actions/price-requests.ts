"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { encodeMessage } from "@/lib/messages"
import {
  createNotification,
  createNotificationEvent,
  notifyAdmins,
} from "@/lib/notifications"
import { createSlug } from "@/lib/slug"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentExpertProfile,
  getCurrentUser,
  getUserOrganizationMemberships,
} from "@/lib/supabase/queries"
import type {
  PriceRequestFormat,
  PriceRequestResponderType,
  PriceRequestStatus,
} from "@/types"

function value(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim()
  return raw || null
}

function positiveNumber(formData: FormData, key: string) {
  const number = Number(value(formData, key))
  return Number.isFinite(number) && number >= 0 ? number : null
}

function formatValue(formData: FormData): PriceRequestFormat {
  const format = value(formData, "format")
  return format === "offline" || format === "hybrid" ? format : "online"
}

function redirectMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeMessage(message)}`)
}

async function canManageOrganization(userId: string, organizationId: string) {
  const memberships = await getUserOrganizationMemberships(userId)
  return memberships.some(
    (membership) =>
      (membership.organization_id ??
        membership.org_id ??
        membership.organizations?.id) === organizationId &&
      ["owner", "admin", "editor"].includes(membership.role ?? "member"),
  )
}

async function notifyMatchingProviders(
  requestId: string,
  title: string,
  serviceCategory: string,
  requesterId: string,
) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return

  const admin = createAdminClient()
  const matchText = serviceCategory.replace(/[,%()]/g, " ").trim()
  const recipients = new Map<
    string,
    {
      targetType: PriceRequestResponderType
      expertId?: string
      organizationId?: string
    }
  >()
  const [{ data: experts }, { data: contractors }] = await Promise.all([
    admin
      .from("expert_profiles")
      .select("id, user_id")
      .eq("is_public", true)
      .eq("status", "published")
      .or(`specializations.ilike.%${matchText}%,skills.ilike.%${matchText}%`)
      .limit(50),
    admin
      .from("organizations")
      .select(
        "id, organization_members(user_id, role), organization_services(services(name))",
      )
      .eq("is_contractor", true)
      .eq("status", "published")
      .limit(50),
  ])

  for (const expert of experts ?? []) {
    if (expert.user_id && expert.user_id !== requesterId) {
      recipients.set(expert.user_id as string, {
        targetType: "expert",
        expertId: expert.id as string,
      })
    }
  }

  for (const organization of contractors ?? []) {
    const matchesService = organization.organization_services?.some((item) => {
      const service = item.services as unknown as {
        name?: string | null
      } | null
      return service?.name?.toLowerCase().includes(matchText.toLowerCase())
    })
    if (!matchesService) continue

    for (const member of organization.organization_members ?? []) {
      if (
        member.user_id &&
        member.user_id !== requesterId &&
        ["owner", "admin", "editor"].includes(member.role ?? "member")
      ) {
        recipients.set(member.user_id as string, {
          targetType: "organization",
          organizationId: organization.id as string,
        })
      }
    }
  }

  await Promise.all(
    [...recipients.entries()].map(async ([recipientId, target]) => {
      let existingInviteQuery = admin
        .from("price_request_invites")
        .select("id")
        .eq("price_request_id", requestId)
      existingInviteQuery =
        target.targetType === "expert"
          ? existingInviteQuery.eq("expert_id", target.expertId!)
          : existingInviteQuery.eq("organization_id", target.organizationId!)
      const { data: existingInvite } = await existingInviteQuery.maybeSingle()

      if (!existingInvite) {
        await admin.from("price_request_invites").insert({
          price_request_id: requestId,
          target_type: target.targetType,
          expert_id: target.expertId ?? null,
          organization_id: target.organizationId ?? null,
          recipient_id: recipientId,
          status: "invited",
          updated_at: new Date().toISOString(),
        })
      }
      await createNotification({
        recipient_id: recipientId,
        title: "Новый запрос стоимости",
        text: `${title} · ${serviceCategory}`,
        type: "price_request",
        target_type: "price_request",
        target_id: requestId,
        target_url: `/price-requests/${requestId}`,
      })
    }),
  )
}

function requestPayload(
  formData: FormData,
  userId: string,
  status: PriceRequestStatus,
) {
  return {
    title: value(formData, "title"),
    description: value(formData, "description"),
    service_category: value(formData, "service_category"),
    industry: value(formData, "industry"),
    project_scale: value(formData, "project_scale"),
    expected_start_date: value(formData, "expected_start_date"),
    expected_deadline: value(formData, "expected_deadline"),
    location: value(formData, "location"),
    format: formatValue(formData),
    created_by: userId,
    organization_id: value(formData, "organization_id"),
    status,
    updated_at: new Date().toISOString(),
  }
}

export async function savePriceRequest(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const id = value(formData, "id")
  const path = id ? `/price-requests/${id}/manage` : "/price-requests/new"
  const intent = value(formData, "intent")
  const status: PriceRequestStatus = intent === "activate" ? "active" : "draft"
  const title = value(formData, "title")
  const serviceCategory = value(formData, "service_category")
  const description = value(formData, "description")
  const organizationId = value(formData, "organization_id")

  if (!title || !serviceCategory) {
    redirectMessage(path, "Укажите название и категорию услуги")
  }
  if (status === "active" && !description) {
    redirectMessage(path, "Добавьте описание перед публикацией запроса")
  }
  if (
    organizationId &&
    !(await canManageOrganization(user.id, organizationId))
  ) {
    redirectMessage(path, "Нет доступа к выбранной организации")
  }

  const supabase = await createClient()
  const payload = requestPayload(formData, user.id, status)
  const updatePayload = { ...payload }
  delete (updatePayload as Partial<typeof updatePayload>).created_by
  const query = id
    ? supabase
        .from("price_requests")
        .update(updatePayload)
        .eq("id", id)
        .select("id")
        .maybeSingle()
    : supabase.from("price_requests").insert(payload).select("id").maybeSingle()
  const { data, error } = await query

  if (error || !data) {
    redirectMessage(path, error?.message ?? "Не удалось сохранить запрос")
  }

  const requestId = data.id as string
  if (status === "active") {
    await createNotificationEvent({
      event_key: "price_request_activated",
      source: "price_requests",
      actor_id: user.id,
      target_type: "price_request",
      target_id: requestId,
      title,
      text: serviceCategory,
    })
    await notifyMatchingProviders(requestId, title, serviceCategory, user.id)
  }

  revalidatePath("/price-requests")
  revalidatePath("/dashboard/price-requests")
  redirectMessage(
    "/dashboard/price-requests",
    status === "active" ? "Запрос опубликован" : "Черновик сохранен",
  )
}

export async function respondToPriceRequest(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const requestId = value(formData, "price_request_id")
  const responder = value(formData, "responder")
  const [responderType, responderId] = (responder ?? "").split(":")
  const path = requestId ? `/price-requests/${requestId}` : "/price-requests"

  if (
    !requestId ||
    !responderId ||
    !["expert", "organization"].includes(responderType)
  ) {
    redirectMessage(path, "Выберите, от чьего имени отправить оценку")
  }

  const minCost = positiveNumber(formData, "min_cost")
  const maxCost = positiveNumber(formData, "max_cost")
  const minDuration = positiveNumber(formData, "min_duration_days")
  const maxDuration = positiveNumber(formData, "max_duration_days")

  if (
    minCost === null ||
    maxCost === null ||
    minDuration === null ||
    maxDuration === null ||
    maxCost < minCost ||
    maxDuration < minDuration ||
    minDuration < 1
  ) {
    redirectMessage(path, "Проверьте диапазоны стоимости и сроков")
  }

  if (responderType === "expert") {
    const { profile } = await getCurrentExpertProfile()
    if (profile?.id !== responderId) {
      redirectMessage(path, "Нет доступа к выбранному профилю эксперта")
    }
  } else if (!(await canManageOrganization(user.id, responderId))) {
    redirectMessage(path, "Нет доступа к выбранной организации")
  }

  const supabase = await createClient()
  const payload = {
    price_request_id: requestId,
    responder_type: responderType,
    expert_id: responderType === "expert" ? responderId : null,
    organization_id: responderType === "organization" ? responderId : null,
    created_by: user.id,
    min_cost: minCost,
    max_cost: maxCost,
    min_duration_days: minDuration,
    max_duration_days: maxDuration,
    comment: value(formData, "comment"),
    willing_to_participate: value(formData, "willing_to_participate") === "on",
    updated_at: new Date().toISOString(),
  }
  let existingQuery = supabase
    .from("price_request_responses")
    .select("id")
    .eq("price_request_id", requestId)
  existingQuery =
    responderType === "expert"
      ? existingQuery.eq("expert_id", responderId)
      : existingQuery.eq("organization_id", responderId)
  const { data: existing } = await existingQuery.maybeSingle()
  const { error } = existing
    ? await supabase
        .from("price_request_responses")
        .update(payload)
        .eq("id", existing.id)
    : await supabase.from("price_request_responses").insert(payload)

  if (error) redirectMessage(path, error.message)

  const { data: request } = await supabase
    .from("price_requests")
    .select("created_by, title")
    .eq("id", requestId)
    .maybeSingle()
  if (request?.created_by && request.created_by !== user.id) {
    await createNotification({
      recipient_id: request.created_by as string,
      title: "Новая оценка стоимости",
      text: request.title as string,
      type: "price_request",
      target_type: "price_request",
      target_id: requestId,
      target_url: `/price-requests/${requestId}`,
    })
  }

  revalidatePath(path)
  redirectMessage(path, "Оценка сохранена")
}

export async function updatePriceRequestStatus(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const id = value(formData, "id")
  const status = value(formData, "status")
  if (!id || (status !== "completed" && status !== "cancelled")) {
    redirectMessage("/dashboard/price-requests", "Некорректный статус")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("price_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error || !data) {
    redirectMessage(
      "/dashboard/price-requests",
      error?.message ?? "Не удалось изменить статус",
    )
  }

  revalidatePath("/dashboard/price-requests")
  redirectMessage("/dashboard/price-requests", "Статус обновлен")
}

export async function convertPriceRequestToTender(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const id = value(formData, "id")
  const path = id ? `/price-requests/${id}/manage` : "/dashboard/price-requests"
  if (!id) redirectMessage(path, "Запрос не найден")

  const supabase = await createClient()
  const { data: request } = await supabase
    .from("price_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!request || request.status !== "active") {
    redirectMessage(path, "Конвертировать можно только активный запрос")
  }
  if (!request.organization_id) {
    redirectMessage(path, "Для создания задания привяжите запрос к организации")
  }
  if (!(await canManageOrganization(user.id, request.organization_id))) {
    redirectMessage(path, "Нет доступа к организации запроса")
  }

  const baseSlug = createSlug(request.title as string)
  const slug = `${baseSlug}-${Date.now().toString(36)}`
  const { data: tender, error } = await supabase
    .from("tenders")
    .insert({
      title: request.title,
      slug,
      description: request.description,
      goal: `Получить предложения по услуге: ${request.service_category}`,
      deadline: request.expected_deadline,
      status: "draft",
      organization_id: request.organization_id,
      created_by: user.id,
    })
    .select("id")
    .maybeSingle()

  if (error || !tender) {
    redirectMessage(path, error?.message ?? "Не удалось создать задание")
  }

  const { error: updateError } = await supabase
    .from("price_requests")
    .update({
      status: "converted_to_tender",
      converted_tender_id: tender.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (updateError) redirectMessage(path, updateError.message)

  await notifyAdmins({
    title: "Запрос стоимости конвертирован в задание",
    text: request.title as string,
    type: "price_request",
    target_type: "tender",
    target_id: tender.id as string,
    target_url: `/dashboard/client/tenders/${tender.id}/edit`,
  })

  revalidatePath("/dashboard/price-requests")
  revalidatePath("/dashboard/client/tenders")
  redirectMessage(
    `/dashboard/client/tenders/${tender.id}/edit`,
    "Черновик задания создан из запроса стоимости",
  )
}
