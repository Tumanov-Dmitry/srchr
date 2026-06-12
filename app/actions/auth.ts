"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getPublicErrorMessage, reportServerError } from "@/lib/security/errors"
import { checkRateLimit, getRequestIdentifier } from "@/lib/security/rate-limit"
import { createClient } from "@/lib/supabase/server"

async function upsertProfile(userId: string, email: string | undefined) {
  const supabase = await createClient()
  const baseProfile = {
    id: userId,
    email: email ?? null,
    role: "guest",
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(baseProfile, { onConflict: "id" })

  if (!error) return

  const { error: fallbackError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: email ?? null,
      account_type: "guest",
    },
    { onConflict: "id" },
  )

  if (fallbackError) {
    throw new Error(fallbackError.message)
  }
}

export async function signup(formData: FormData) {
  const requestHeaders = await headers()
  const rateLimit = checkRateLimit(
    `auth:signup:${getRequestIdentifier(requestHeaders)}`,
    5,
    15 * 60 * 1000,
  )

  if (!rateLimit.allowed) {
    redirect("/signup?message=Слишком много попыток. Попробуйте позже.")
  }

  const supabase = await createClient()
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    reportServerError("auth.signup", error)
    redirect(
      `/signup?message=${encodeURIComponent(
        getPublicErrorMessage(error, "Не удалось зарегистрироваться"),
      )}`,
    )
  }

  if (data.user) {
    try {
      await upsertProfile(data.user.id, data.user.email)
    } catch (profileError) {
      reportServerError("auth.signup.profile", profileError)
      redirect("/signup?message=Не удалось создать профиль пользователя")
    }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard/onboarding")
}

export async function login(formData: FormData) {
  const requestHeaders = await headers()
  const rateLimit = checkRateLimit(
    `auth:login:${getRequestIdentifier(requestHeaders)}`,
    10,
    15 * 60 * 1000,
  )

  if (!rateLimit.allowed) {
    redirect("/login?message=Слишком много попыток. Попробуйте позже.")
  }

  const supabase = await createClient()
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    reportServerError("auth.login", error)
    redirect("/login?message=Неверный email или пароль")
  }

  revalidatePath("/", "layout")
  redirect("/dashboard/onboarding")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}
