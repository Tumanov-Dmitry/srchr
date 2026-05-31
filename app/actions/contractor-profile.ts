"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentContractorOrganization } from "@/lib/supabase/queries"
import { createSlug } from "@/lib/slug"

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

function getMissingColumn(error: { message?: string } | null) {
  const match = error?.message?.match(/'([^']+)' column/)
  return match?.[1]
}

async function getAvailableSlug(organizationId: string, rawSlug: string | null, name: string | null) {
  const supabase = await createClient()
  const baseSlug = createSlug(rawSlug || name || "contractor")
  let candidate = baseSlug

  for (let index = 0; index < 20; index += 1) {
    const { data } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", candidate)
      .neq("id", organizationId)
      .maybeSingle()

    if (!data) return candidate

    candidate = `${baseSlug}-${index + 2}`
  }

  return `${baseSlug}-${Date.now().toString(36)}`
}

async function updateOrganization(organizationId: string, formData: FormData) {
  const supabase = await createClient()
  const status = value(formData, "status") === "published" ? "published" : "draft"
  const name = value(formData, "name")
  const website = value(formData, "website_url")
  const slug = await getAvailableSlug(
    organizationId,
    value(formData, "slug") || website,
    name,
  )
  const payload = {
    name,
    slug,
    description: value(formData, "description"),
    city: value(formData, "city"),
    website_url: website,
    status,
  }

  const { error } = await supabase
    .from("organizations")
    .update(payload)
    .eq("id", organizationId)

  if (!error) return

  const { error: fallbackError } = await supabase
    .from("organizations")
    .update({
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      city: payload.city,
      website: payload.website_url,
      status: payload.status,
    })
    .eq("id", organizationId)

  if (fallbackError) {
    throw new Error(fallbackError.message)
  }
}

async function saveContractorProfile(organizationId: string, formData: FormData) {
  const supabase = await createClient()
  const payload: Record<string, string | number | null> = {
    organization_id: organizationId,
    short_description: value(formData, "short_description"),
    full_description: value(formData, "full_description"),
    telegram_url: value(formData, "telegram_url"),
    contact_email: value(formData, "contact_email"),
    contact_phone: value(formData, "contact_phone"),
    min_budget: numberValue(formData, "min_budget"),
    price_description: value(formData, "price_description"),
    team_size: numberValue(formData, "team_size"),
  }

  const { data: existing, error: lookupError } = await supabase
    .from("contractor_profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (!lookupError && existing?.id) {
    const nextPayload = { ...payload }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { error } = await supabase
        .from("contractor_profiles")
        .update(nextPayload)
        .eq("id", existing.id)

      if (!error) return

      const missingColumn = getMissingColumn(error)
      if (!missingColumn || !(missingColumn in nextPayload)) {
        throw new Error(error.message)
      }

      delete nextPayload[missingColumn]
    }

    throw new Error("Не удалось сохранить профиль подрядчика")
  }

  if (lookupError) {
    throw new Error(lookupError.message)
  }

  const nextPayload = { ...payload }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { error } = await supabase
      .from("contractor_profiles")
      .insert(nextPayload)

    if (!error) return

    const missingColumn = getMissingColumn(error)
    if (!missingColumn || !(missingColumn in nextPayload)) {
      throw new Error(error.message)
    }

    delete nextPayload[missingColumn]
  }

  throw new Error("Не удалось создать профиль подрядчика")
}

export async function updateContractorProfile(formData: FormData) {
  const { organization } = await getCurrentContractorOrganization()

  if (!organization) {
    redirect("/onboarding")
  }

  try {
    await updateOrganization(organization.id, formData)
    await saveContractorProfile(organization.id, formData)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось сохранить профиль"
    redirect(`/dashboard/contractor/profile?message=${encodeURIComponent(message)}`)
  }

  revalidatePath("/dashboard/contractor")
  revalidatePath("/dashboard/contractor/profile")
  redirect("/dashboard/contractor")
}

export async function setContractorPublicationStatus(formData: FormData) {
  const { organization } = await getCurrentContractorOrganization()

  if (!organization) {
    redirect("/onboarding")
  }

  const status = value(formData, "status") === "published" ? "published" : "draft"
  const slug = await getAvailableSlug(
    organization.id,
    organization.slug,
    organization.name,
  )
  const supabase = await createClient()
  const { error } = await supabase
    .from("organizations")
    .update({ status, slug })
    .eq("id", organization.id)

  if (error) {
    redirect(
      `/dashboard/contractor?message=${encodeURIComponent(error.message)}`,
    )
  }

  revalidatePath("/dashboard/contractor")
  revalidatePath("/contractors")
  redirect("/dashboard/contractor")
}
