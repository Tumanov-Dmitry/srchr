"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSlug } from "@/lib/slug"
import { encodeMessage } from "@/lib/messages"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/queries"

type ExpertPayload = {
  user_id: string
  slug: string
  avatar_url: string | null
  first_name: string
  last_name: string | null
  position: string | null
  short_description: string | null
  city: string | null
  specializations: string | null
  skills: string | null
  activity_areas: string | null
  experience_description: string | null
  experience_years: number | null
  telegram_url: string | null
  contact_email: string | null
  website_url: string | null
  linkedin_url: string | null
  behance_url: string | null
  dribbble_url: string | null
  is_public: boolean
  is_open_to_work: boolean
  status: string
  updated_at: string
}

function value(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim()
  return raw.length > 0 ? raw : null
}

function numberValue(formData: FormData, key: string) {
  const raw = value(formData, key)
  if (!raw) return null

  const number = Number(raw)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeMessage(message)}`)
}

function getMissingColumn(error: { message?: string } | null) {
  const match = error?.message?.match(/'([^']+)' column/)
  return match?.[1]
}

async function upsertExpertWithFallback(payload: ExpertPayload) {
  const supabase = await createClient()
  const nextPayload: Partial<ExpertPayload> = { ...payload }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { error } = await supabase
      .from("expert_profiles")
      .upsert(nextPayload, { onConflict: "user_id" })

    if (!error) return

    const missingColumn = getMissingColumn(error)
    if (!missingColumn || !(missingColumn in nextPayload)) {
      throw new Error(error.message)
    }

    delete nextPayload[missingColumn as keyof ExpertPayload]
  }

  throw new Error("Не удалось сохранить профиль эксперта")
}

export async function saveExpertProfile(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  const firstName = value(formData, "first_name")
  const lastName = value(formData, "last_name")
  const slug = createSlug(
    value(formData, "slug") ??
      [firstName, lastName].filter(Boolean).join(" ") ??
      user.email ??
      "expert",
  )

  if (!firstName) {
    redirectWithMessage("/dashboard/expert", "Укажите имя эксперта")
  }

  const isPublic = value(formData, "is_public") === "on"

  try {
    await upsertExpertWithFallback({
      user_id: user.id,
      slug,
      avatar_url: value(formData, "avatar_url"),
      first_name: firstName,
      last_name: lastName,
      position: value(formData, "position"),
      short_description: value(formData, "short_description"),
      city: value(formData, "city"),
      specializations: value(formData, "specializations"),
      skills: value(formData, "skills"),
      activity_areas: value(formData, "activity_areas"),
      experience_description: value(formData, "experience_description"),
      experience_years: numberValue(formData, "experience_years"),
      telegram_url: value(formData, "telegram_url"),
      contact_email: value(formData, "contact_email") ?? user.email ?? null,
      website_url: value(formData, "website_url"),
      linkedin_url: value(formData, "linkedin_url"),
      behance_url: value(formData, "behance_url"),
      dribbble_url: value(formData, "dribbble_url"),
      is_public: isPublic,
      is_open_to_work: value(formData, "is_open_to_work") === "on",
      status: isPublic ? "published" : "draft",
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить профиль эксперта"
    redirectWithMessage("/dashboard/expert", message)
  }

  revalidatePath("/experts")
  revalidatePath(`/@${slug}`)
  revalidatePath("/dashboard/expert")
  redirectWithMessage("/dashboard/expert", "Профиль эксперта сохранен")
}
