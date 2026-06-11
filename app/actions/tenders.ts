"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { syncTenderAnalyticsFacts, trackAnalyticsEvent } from "@/lib/analytics"
import { createNotificationEvent, notifyAdmins } from "@/lib/notifications"
import { createSlug } from "@/lib/slug"
import { reportServerError } from "@/lib/security/errors"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentContractorOrganization,
  getCurrentExpertProfile,
  getCurrentTenderOwnerOrganization,
  getCurrentUser,
} from "@/lib/supabase/queries"

type PayloadValue = string | number | null

function value(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim()
  return raw.length > 0 ? raw : null
}

function numberValue(formData: FormData, key: string) {
  const raw = value(formData, key)
  if (!raw) return null

  const number = Number(raw)
  return Number.isFinite(number) && number > 0 ? number : null
}

function tenderStatus(formData: FormData) {
  const status = value(formData, "status")
  return ["draft", "published", "closed", "archived"].includes(status ?? "")
    ? status
    : "draft"
}

function responseStatus(formData: FormData) {
  const status = value(formData, "status")
  return ["viewed", "accepted", "rejected"].includes(status ?? "")
    ? status
    : "viewed"
}

function getMissingColumn(error: { message?: string } | null) {
  const match = error?.message?.match(/'([^']+)' column/)
  return match?.[1]
}

async function writeWithSchemaFallback(
  table: string,
  payload: Record<string, PayloadValue>,
  update?: { column: string; value: string },
) {
  const supabase = await createClient()
  const nextPayload = { ...payload }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const query = update
      ? supabase
          .from(table)
          .update(nextPayload)
          .eq(update.column, update.value)
          .select("id")
          .maybeSingle()
      : supabase.from(table).insert(nextPayload).select("id").single()

    const { data, error } = await query

    if (!error) return data

    const missingColumn = getMissingColumn(error)
    if (!missingColumn || !(missingColumn in nextPayload)) {
      throw new Error(error.message)
    }

    delete nextPayload[missingColumn]
  }

  throw new Error("Не удалось сохранить данные")
}

async function notifyAdminsAboutTender({
  id,
  title,
  slug,
  status,
  actorId,
}: {
  id: string
  title: string
  slug: string
  status: string | null
  actorId: string
}) {
  const isPublished = status === "published"

  await createNotificationEvent({
    event_key: isPublished ? "task_published" : "task_created",
    event_type: isPublished ? "task_published" : "task_created",
    source: "tenders",
    actor_id: actorId,
    target_type: "tender",
    target_id: id,
    title: isPublished
      ? `Новая опубликованная задача: ${title}`
      : `Новая задача: ${title}`,
    text: isPublished
      ? "Пользователь опубликовал новую задачу."
      : "Пользователь создал новую задачу.",
  })
  await notifyAdmins({
    title: isPublished ? "Новая опубликованная задача" : "Новая задача",
    text: title,
    type: "admin",
    target_type: "tender",
    target_id: id,
    target_url: `/tenders/${slug}`,
  })
}

async function getAvailableTenderSlug(
  tenderId: string | null,
  rawSlug: string | null,
  title: string | null,
) {
  const supabase = await createClient()
  const baseSlug = createSlug(rawSlug || title || "tender")
  let candidate = baseSlug

  for (let index = 0; index < 20; index += 1) {
    let query = supabase.from("tenders").select("id").eq("slug", candidate)

    if (tenderId) {
      query = query.neq("id", tenderId)
    }

    const { data } = await query.maybeSingle()

    if (!data) return candidate

    candidate = `${baseSlug}-${index + 2}`
  }

  return `${baseSlug}-${Date.now().toString(36)}`
}

function buildTenderPayload(
  formData: FormData,
  organizationId: string,
  userId: string,
  slug: string,
) {
  const status = tenderStatus(formData)
  const budgetFrom = numberValue(formData, "budget_from")

  return {
    title: value(formData, "title"),
    slug,
    description: value(formData, "description"),
    goal: value(formData, "goal"),
    budget_from: budgetFrom,
    budget_to: numberValue(formData, "budget_to"),
    budget: budgetFrom,
    deadline: value(formData, "deadline"),
    status,
    organization_id: organizationId,
    created_by: userId,
    published_at: status === "published" ? new Date().toISOString() : null,
  }
}

export async function createTender(formData: FormData) {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")

  const title = value(formData, "title")
  if (!title) {
    redirect("/dashboard/client/tenders/new?message=Укажите название задачи")
  }

  try {
    const slug = await getAvailableTenderSlug(
      null,
      value(formData, "slug"),
      title,
    )
    const createdTender = await writeWithSchemaFallback(
      "tenders",
      buildTenderPayload(formData, organization.id, user.id, slug),
    )

    if (createdTender) {
      await syncTenderAnalyticsFacts(createdTender.id as string)
      await trackAnalyticsEvent({
        eventType: "tender_saved",
        actorUserId: user.id,
        targetType: "tender",
        targetId: createdTender.id as string,
        ownerType: "organization",
        ownerId: organization.id,
        source: "tender_editor",
        metadata: { action: "created", status: tenderStatus(formData) },
      })
      await notifyAdminsAboutTender({
        id: createdTender.id as string,
        title,
        slug,
        status: tenderStatus(formData),
        actorId: user.id,
      })
    }
  } catch (error) {
    reportServerError("tenders.create", error)
    redirect("/dashboard/client/tenders/new?message=Не удалось создать задачу")
  }

  revalidatePath("/tenders")
  revalidatePath("/dashboard/client/tenders")
  redirect("/dashboard/client/tenders")
}

export async function updateTender(tenderId: string, formData: FormData) {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")

  const supabase = await createClient()
  const { data: tender } = await supabase
    .from("tenders")
    .select("id")
    .eq("id", tenderId)
    .eq("organization_id", organization.id)
    .maybeSingle()

  if (!tender) redirect("/dashboard/client/tenders")

  const title = value(formData, "title")
  if (!title) {
    redirect(
      `/dashboard/client/tenders/${tenderId}/edit?message=Укажите название задачи`,
    )
  }

  try {
    const slug = await getAvailableTenderSlug(
      tenderId,
      value(formData, "slug"),
      title,
    )
    const updatedTender = await writeWithSchemaFallback(
      "tenders",
      buildTenderPayload(formData, organization.id, user.id, slug),
      { column: "id", value: tenderId },
    )

    if (updatedTender && tenderStatus(formData) === "published") {
      await notifyAdminsAboutTender({
        id: tenderId,
        title,
        slug,
        status: "published",
        actorId: user.id,
      })
    }
    if (updatedTender) {
      await syncTenderAnalyticsFacts(tenderId)
      await trackAnalyticsEvent({
        eventType: "tender_saved",
        actorUserId: user.id,
        targetType: "tender",
        targetId: tenderId,
        ownerType: "organization",
        ownerId: organization.id,
        source: "tender_editor",
        metadata: { action: "updated", status: tenderStatus(formData) },
      })
    }
  } catch (error) {
    reportServerError("tenders.update", error)
    redirect(
      `/dashboard/client/tenders/${tenderId}/edit?message=Не удалось сохранить задачу`,
    )
  }

  revalidatePath("/tenders")
  revalidatePath("/dashboard/client/tenders")
  redirect("/dashboard/client/tenders")
}

export async function createTenderResponse(
  tenderId: string,
  formData: FormData,
) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [{ organization }, { profile: expertProfile }] = await Promise.all([
    getCurrentContractorOrganization(),
    getCurrentExpertProfile(),
  ])
  const requestedResponderType = value(formData, "responder_type")
  const hasContractor = Boolean(organization)
  const hasExpert = Boolean(expertProfile)
  const responderType =
    requestedResponderType === "expert" && hasExpert
      ? "expert"
      : requestedResponderType === "contractor" && hasContractor
        ? "contractor"
        : hasContractor && !hasExpert
          ? "contractor"
          : hasExpert
            ? "expert"
            : null

  if (!responderType) {
    redirect(
      "/dashboard/expert?message=Создайте профиль эксперта или организацию-подрядчика для откликов",
    )
  }

  const supabase = await createClient()
  const { data: tender } = await supabase
    .from("tenders")
    .select("id, slug, organization_id")
    .eq("id", tenderId)
    .eq("status", "published")
    .maybeSingle()

  if (!tender) redirect("/tenders")
  if (organization && tender.organization_id === organization.id) {
    redirect(
      `/tenders/${tender.slug}?message=Нельзя откликнуться на свою задачу`,
    )
  }

  let existingQuery = supabase
    .from("tender_responses")
    .select("id")
    .eq("tender_id", tenderId)

  if (responderType === "contractor" && organization) {
    existingQuery = existingQuery.eq("organization_id", organization.id)
  } else {
    existingQuery = existingQuery.eq("user_id", user.id)
  }

  const { data: existing } = await existingQuery.limit(1).maybeSingle()

  if (existing) {
    redirect(
      `/tenders/${tender.slug}?message=Вы уже откликнулись на эту задачу`,
    )
  }

  const message = value(formData, "message")
  if (!message) {
    redirect(`/tenders/${tender.slug}?message=Напишите сообщение для заказчика`)
  }

  try {
    await writeWithSchemaFallback("tender_responses", {
      tender_id: tenderId,
      organization_id:
        responderType === "contractor" ? (organization?.id ?? null) : null,
      expert_id:
        responderType === "expert" ? (expertProfile?.id ?? null) : null,
      responder_type: responderType,
      user_id: user.id,
      message,
      status: "sent",
    })
    await trackAnalyticsEvent({
      eventType: "tender_response_created",
      actorUserId: user.id,
      targetType: "tender",
      targetId: tenderId,
      ownerType: "organization",
      ownerId: tender.organization_id as string,
      source: "tender_response",
      metadata: { responder_type: responderType },
    })
  } catch (error) {
    reportServerError("tenders.createResponse", error)
    redirect(`/tenders/${tender.slug}?message=Не удалось отправить отклик`)
  }

  revalidatePath(`/tenders/${tender.slug}`)
  revalidatePath("/dashboard/contractor/responses")
  redirect(`/tenders/${tender.slug}?message=Отклик отправлен`)
}

export async function updateTenderResponseStatus(
  tenderId: string,
  responseId: string,
  formData: FormData,
) {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")

  const supabase = await createClient()
  const { data: tender } = await supabase
    .from("tenders")
    .select("id")
    .eq("id", tenderId)
    .eq("organization_id", organization.id)
    .maybeSingle()

  if (!tender) redirect("/dashboard/client/tenders")

  const { error } = await supabase
    .from("tender_responses")
    .update({ status: responseStatus(formData) })
    .eq("id", responseId)
    .eq("tender_id", tenderId)

  if (error) {
    reportServerError("tenders.updateResponseStatus", error)
    redirect(
      `/dashboard/client/tenders/${tenderId}/responses?message=Не удалось изменить статус отклика`,
    )
  }

  await trackAnalyticsEvent({
    eventType: "tender_response_status_changed",
    actorUserId: user.id,
    targetType: "tender",
    targetId: tenderId,
    ownerType: "organization",
    ownerId: organization.id,
    source: "tender_responses",
    metadata: {
      response_id: responseId,
      status: responseStatus(formData),
    },
  })

  revalidatePath(`/dashboard/client/tenders/${tenderId}/responses`)
  redirect(`/dashboard/client/tenders/${tenderId}/responses`)
}
