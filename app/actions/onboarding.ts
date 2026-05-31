"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createSlug } from "@/lib/slug"
import type { AccountRole, OnboardingRole } from "@/types"

function slugify(value: string) {
  return `${createSlug(value)}-${Date.now().toString(36)}`
}

async function saveProfileRole(userId: string, email: string | undefined, role: AccountRole) {
  const supabase = await createClient()
  const payload = {
    id: userId,
    email: email ?? null,
    role,
    onboarding_completed: true,
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })

  if (!error) return

  await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: email ?? null,
        account_type: role,
      },
      { onConflict: "id" },
    )
}

async function createOrganizationMember(
  organizationId: string,
  userId: string,
  role: OnboardingRole,
) {
  const supabase = await createClient()
  const memberRole = role === "contractor" ? "owner" : "admin"

  const { error } = await supabase.from("organization_members").insert({
    organization_id: organizationId,
    user_id: userId,
    role: memberRole,
  })

  if (!error) return

  const { error: fallbackError } = await supabase.from("organization_members").insert({
    org_id: organizationId,
    profile_id: userId,
    role: memberRole,
  })

  if (fallbackError) {
    throw new Error(fallbackError.message)
  }
}

function optionalValue(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim()
  return raw.length > 0 ? raw : null
}

function optionalNumber(formData: FormData, key: string) {
  const raw = optionalValue(formData, key)
  if (!raw) return null

  const number = Number(raw)
  return Number.isFinite(number) && number > 0 ? number : null
}

function getMissingColumn(error: { message?: string } | null) {
  const match = error?.message?.match(/'([^']+)' column/)
  return match?.[1]
}

async function createContractorProfile(organizationId: string, formData: FormData) {
  const supabase = await createClient()
  const description = String(formData.get("description") ?? "").trim()
  const websiteUrl = optionalValue(formData, "website")
  const payload: Record<string, string | number | null> = {
    organization_id: organizationId,
    description,
    short_description: optionalValue(formData, "short_description") ?? description,
    full_description: optionalValue(formData, "full_description"),
    telegram_url: optionalValue(formData, "telegram_url"),
    contact_email: optionalValue(formData, "contact_email"),
    contact_phone: optionalValue(formData, "contact_phone"),
    min_budget: optionalNumber(formData, "min_budget"),
    price_description: optionalValue(formData, "price_description"),
    team_size: optionalNumber(formData, "team_size"),
  }

  let nextPayload = { ...payload }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { error } = await supabase.from("contractor_profiles").insert(nextPayload)

    if (!error) return

    const missingColumn = getMissingColumn(error)
    if (!missingColumn || !(missingColumn in nextPayload)) {
      throw new Error(error.message)
    }

    delete nextPayload[missingColumn]
  }

  throw new Error("Не удалось создать профиль подрядчика")
}

async function createOrganization({
  name,
  description,
  city,
  website,
  logoUrl,
  onboardingRole,
}: {
  name: string
  description: string
  city: string
  website: string
  logoUrl: string
  onboardingRole: OnboardingRole
}) {
  const supabase = await createClient()
  const basePayload = {
    name,
    slug: slugify(name),
    description,
    city,
    is_contractor: onboardingRole === "contractor",
    is_client: onboardingRole === "client",
    status: "draft",
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      ...basePayload,
      website: website || null,
      logo_url: logoUrl || null,
    })
    .select("id")
    .single()

  if (!error && data) return data

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("organizations")
    .insert(basePayload)
    .select("id")
    .single()

  if (fallbackError || !fallbackData) {
    throw new Error(fallbackError?.message ?? error?.message ?? "Не удалось создать организацию")
  }

  return fallbackData
}

async function attachServices(organizationId: string, serviceIds: string[]) {
  if (serviceIds.length === 0) return

  const supabase = await createClient()
  const rows = serviceIds.map((serviceId) => ({
    organization_id: organizationId,
    service_id: serviceId,
  }))

  const { error } = await supabase.from("organization_services").insert(rows)

  if (!error) return

  await supabase.from("organization_services").insert(
    serviceIds.map((serviceId) => ({
      org_id: organizationId,
      service_id: serviceId,
    })),
  )
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const onboardingRole = String(formData.get("role") ?? "client") as OnboardingRole
  const accountRole: AccountRole =
    onboardingRole === "contractor" ? "contractor" : "client"

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const city = String(formData.get("city") ?? "").trim()
  const website = String(formData.get("website") ?? "").trim()
  const logoUrl = String(formData.get("logo_url") ?? "").trim()
  const serviceIds = formData.getAll("services").map(String).filter(Boolean)

  if (!name || !description || !city) {
    redirect("/onboarding?message=Заполните обязательные поля")
  }

  let organization: { id: string }

  try {
    organization = await createOrganization({
      name,
      description,
      city,
      website,
      logoUrl,
      onboardingRole,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать организацию"
    redirect(`/onboarding?message=${encodeURIComponent(message)}`)
  }

  await saveProfileRole(user.id, user.email, accountRole)
  await createOrganizationMember(organization.id, user.id, onboardingRole)

  if (onboardingRole === "contractor") {
    await createContractorProfile(organization.id, formData)
    await attachServices(organization.id, serviceIds)
  }

  revalidatePath("/", "layout")
  redirect(onboardingRole === "contractor" ? "/dashboard/contractor" : "/dashboard/client")
}
