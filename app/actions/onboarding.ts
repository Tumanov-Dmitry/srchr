"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { reportServerError } from "@/lib/security/errors"
import { createNotification } from "@/lib/notifications"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { createSlug } from "@/lib/slug"
import type { MarketRole, OnboardingRole } from "@/types"

function slugify(value: string) {
  return `${createSlug(value)}-${Date.now().toString(36)}`
}

async function markOnboardingComplete(userId: string, marketRole: MarketRole) {
  const supabase = await createClient()
  const payload: Record<string, boolean | string> = {
    onboarding_completed: true,
    market_role: marketRole,
  }
  const nextPayload = { ...payload }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await supabase
      .from("profiles")
      .update(nextPayload)
      .eq("id", userId)

    if (!error) return

    const missingColumn = getMissingColumn(error)
    if (!missingColumn || !(missingColumn in nextPayload)) {
      throw new Error(error.message)
    }

    delete nextPayload[missingColumn]
  }
}

async function createOrganizationMember(
  organizationId: string,
  userId: string,
  role: Exclude<OnboardingRole, "expert">,
) {
  const supabase = await createClient()
  const memberRole = role === "contractor" ? "owner" : "admin"

  const { error } = await supabase.from("organization_members").insert({
    organization_id: organizationId,
    user_id: userId,
    role: memberRole,
  })

  if (!error) return

  const { error: fallbackError } = await supabase
    .from("organization_members")
    .insert({
      org_id: organizationId,
      profile_id: userId,
      role: memberRole,
    })

  if (fallbackError) {
    throw new Error(fallbackError.message)
  }
}

async function getAvailableExpertSlug(name: string, email?: string) {
  const supabase = await createClient()
  const baseSlug = createSlug(name || email?.split("@")[0] || "expert")
  let candidate = baseSlug

  for (let index = 0; index < 20; index += 1) {
    const { data } = await supabase
      .from("expert_profiles")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()

    if (!data) return candidate
    candidate = `${baseSlug}-${index + 2}`
  }

  return `${baseSlug}-${Date.now().toString(36)}`
}

function optionalValue(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim()
  return raw.length > 0 ? raw : null
}

async function createExpertProfile(
  userId: string,
  email: string | undefined,
  formData: FormData,
) {
  const supabase = await createClient()
  const firstName = String(formData.get("name") ?? "").trim()
  const lastName = optionalValue(formData, "last_name")
  const baseSlug = await getAvailableExpertSlug(
    [firstName, lastName].filter(Boolean).join(" "),
    email,
  )

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`
    const { error } = await supabase.from("expert_profiles").upsert(
      {
        user_id: userId,
        slug,
        first_name: firstName || email?.split("@")[0] || "Эксперт",
        last_name: lastName,
        position: optionalValue(formData, "position"),
        short_description: optionalValue(formData, "description"),
        city: optionalValue(formData, "city"),
        specializations: optionalValue(formData, "specializations"),
        skills: optionalValue(formData, "skills"),
        contact_email: email ?? null,
        is_public: false,
        is_open_to_work: true,
        status: "draft",
      },
      { onConflict: "user_id" },
    )

    if (!error) return
    if (
      error.code !== "23505" ||
      !error.message.toLowerCase().includes("slug")
    ) {
      throw new Error(error.message)
    }
  }

  throw new Error("Не удалось подобрать свободный адрес профиля")
}

async function requestOrganizationAccess(
  organizationId: string,
  userId: string,
  marketRole: MarketRole,
) {
  const supabase = await createClient()
  const { error } = await supabase.from("organization_join_requests").insert({
    organization_id: organizationId,
    user_id: userId,
    requested_role: "member",
    message:
      marketRole === "agency"
        ? "Представитель агентства запросил доступ"
        : "Представитель компании запросил доступ",
  })

  if (error && error.code !== "23505") {
    throw new Error(error.message)
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return

  const admin = createAdminClient()
  const { data: owners } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .in("role", ["owner", "admin"])

  await Promise.all(
    (owners ?? []).map((owner) =>
      createNotification({
        recipient_id: owner.user_id,
        title: "Новый запрос в организацию",
        text: "Пользователь хочет присоединиться к вашей организации.",
        type: "organization_join_request",
        target_type: "organization",
        target_id: organizationId,
        target_url: "/dashboard/organization",
      }),
    ),
  )
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

async function createContractorProfile(
  organizationId: string,
  formData: FormData,
) {
  const supabase = await createClient()
  const description = String(formData.get("description") ?? "").trim()
  const payload: Record<string, string | number | null> = {
    organization_id: organizationId,
    description,
    short_description:
      optionalValue(formData, "short_description") ?? description,
    full_description: optionalValue(formData, "full_description"),
    telegram_url: optionalValue(formData, "telegram_url"),
    contact_email: optionalValue(formData, "contact_email"),
    contact_phone: optionalValue(formData, "contact_phone"),
    min_budget: optionalNumber(formData, "min_budget"),
    price_description: optionalValue(formData, "price_description"),
    team_size: optionalNumber(formData, "team_size"),
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
    created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
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
    .insert({
      name: basePayload.name,
      slug: basePayload.slug,
      description: basePayload.description,
      city: basePayload.city,
      is_contractor: basePayload.is_contractor,
      is_client: basePayload.is_client,
      status: basePayload.status,
    })
    .select("id")
    .single()

  if (fallbackError || !fallbackData) {
    throw new Error(
      fallbackError?.message ??
        error?.message ??
        "Не удалось создать организацию",
    )
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

  const requestedMarketRole = String(formData.get("market_role") ?? "")
  const isSkip = String(formData.get("intent") ?? "") === "skip"
  const marketRole: MarketRole =
    requestedMarketRole === "agency"
      ? "agency"
      : requestedMarketRole === "company"
        ? "company"
        : "independent"

  const name = String(formData.get("name") ?? "").trim()
  const website = String(formData.get("website") ?? "").trim()
  const logoUrl = String(formData.get("logo_url") ?? "").trim()
  const serviceIds = formData.getAll("services").map(String).filter(Boolean)

  try {
    await createExpertProfile(user.id, user.email, formData)
    await markOnboardingComplete(user.id, marketRole)
  } catch (error) {
    reportServerError("onboarding.expert", error)
    redirect(
      "/dashboard/onboarding?message=Не удалось создать профиль эксперта",
    )
  }

  const organizationAction = String(formData.get("organization_action") ?? "")
  const selectedOrganizationId = String(
    formData.get("organization_id") ?? "",
  ).trim()

  try {
    if (
      !isSkip &&
      marketRole !== "independent" &&
      organizationAction === "request" &&
      selectedOrganizationId
    ) {
      await requestOrganizationAccess(
        selectedOrganizationId,
        user.id,
        marketRole,
      )
    }

    if (
      !isSkip &&
      marketRole !== "independent" &&
      organizationAction === "create"
    ) {
      const organizationName =
        String(formData.get("organization_name") ?? "").trim() || name
      const organizationDescription = String(
        formData.get("organization_description") ?? "",
      ).trim()
      const organizationCity = String(
        formData.get("organization_city") ?? "",
      ).trim()

      if (organizationName) {
        const onboardingRole: Exclude<OnboardingRole, "expert"> =
          marketRole === "agency" ? "contractor" : "client"
        const organization = await createOrganization({
          name: organizationName,
          description: organizationDescription,
          city: organizationCity,
          website,
          logoUrl,
          onboardingRole,
        })
        await createOrganizationMember(organization.id, user.id, onboardingRole)

        if (onboardingRole === "contractor") {
          await createContractorProfile(organization.id, formData)
          await attachServices(organization.id, serviceIds)
        }
      }
    }
  } catch (error) {
    reportServerError("onboarding.organization", error)
  }

  try {
    await createNotification({
      recipient_id: user.id,
      title: "Завершите профиль эксперта",
      text: "Добавьте фото, специализацию, навыки и контакты, чтобы профиль вызывал больше доверия.",
      type: "profile_incomplete",
      target_type: "expert",
      target_url: "/dashboard/expert",
    })
  } catch (error) {
    reportServerError("onboarding.completionNotification", error)
  }

  revalidatePath("/", "layout")
  redirect("/dashboard/expert")
}
