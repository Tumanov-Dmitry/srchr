"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSlug } from "@/lib/slug"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentContractorOrganization,
  getCurrentTenderOwnerOrganization,
  getCurrentUser,
} from "@/lib/supabase/queries"

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
  payload: Record<string, string | number | null>,
  update?: { column: string; value: string },
) {
  const supabase = await createClient()
  const nextPayload = { ...payload }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const query = update
      ? supabase.from(table).update(nextPayload).eq(update.column, update.value)
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
    const slug = await getAvailableTenderSlug(null, value(formData, "slug"), title)
    await writeWithSchemaFallback(
      "tenders",
      buildTenderPayload(formData, organization.id, user.id, slug),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать задачу"
    redirect(`/dashboard/client/tenders/new?message=${encodeURIComponent(message)}`)
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
    redirect(`/dashboard/client/tenders/${tenderId}/edit?message=Укажите название задачи`)
  }

  try {
    const slug = await getAvailableTenderSlug(tenderId, value(formData, "slug"), title)
    await writeWithSchemaFallback(
      "tenders",
      buildTenderPayload(formData, organization.id, user.id, slug),
      { column: "id", value: tenderId },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить задачу"
    redirect(
      `/dashboard/client/tenders/${tenderId}/edit?message=${encodeURIComponent(message)}`,
    )
  }

  revalidatePath("/tenders")
  revalidatePath("/dashboard/client/tenders")
  redirect("/dashboard/client/tenders")
}

export async function createTenderResponse(tenderId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { organization } = await getCurrentContractorOrganization()
  if (!organization) redirect("/onboarding")

  const supabase = await createClient()
  const { data: tender } = await supabase
    .from("tenders")
    .select("id, slug, organization_id")
    .eq("id", tenderId)
    .eq("status", "published")
    .maybeSingle()

  if (!tender) redirect("/tenders")
  if (tender.organization_id === organization.id) {
    redirect(`/tenders/${tender.slug}?message=Нельзя откликнуться на свою задачу`)
  }

  const { data: existing } = await supabase
    .from("tender_responses")
    .select("id")
    .eq("tender_id", tenderId)
    .eq("organization_id", organization.id)
    .maybeSingle()

  if (existing) {
    redirect(`/tenders/${tender.slug}?message=Вы уже откликнулись на эту задачу`)
  }

  const message = value(formData, "message")
  if (!message) {
    redirect(`/tenders/${tender.slug}?message=Напишите сообщение для заказчика`)
  }

  try {
    await writeWithSchemaFallback("tender_responses", {
      tender_id: tenderId,
      organization_id: organization.id,
      user_id: user.id,
      message,
      status: "sent",
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Не удалось отправить отклик"
    redirect(`/tenders/${tender.slug}?message=${encodeURIComponent(errorMessage)}`)
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
    redirect(
      `/dashboard/client/tenders/${tenderId}/responses?message=${encodeURIComponent(error.message)}`,
    )
  }

  revalidatePath(`/dashboard/client/tenders/${tenderId}/responses`)
  redirect(`/dashboard/client/tenders/${tenderId}/responses`)
}
