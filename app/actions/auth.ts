"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { AccountRole } from "@/types"

async function upsertProfile(
  userId: string,
  email: string | undefined,
  role: AccountRole,
) {
  const supabase = await createClient()
  const baseProfile = {
    id: userId,
    email: email ?? null,
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ ...baseProfile, role }, { onConflict: "id" })

  if (!error) return

  const { error: fallbackError } = await supabase
    .from("profiles")
    .upsert({ ...baseProfile, account_type: role }, { onConflict: "id" })

  if (fallbackError) {
    throw new Error(fallbackError.message)
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const role = String(formData.get("role") ?? "guest") as AccountRole

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
      },
    },
  })

  if (error) {
    redirect(`/signup?message=${encodeURIComponent(error.message)}`)
  }

  if (data.user) {
    await upsertProfile(data.user.id, data.user.email, role)
  }

  revalidatePath("/", "layout")
  redirect("/onboarding")
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/", "layout")
  redirect("/onboarding")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}
