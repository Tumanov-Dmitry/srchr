import { NextResponse } from "next/server"

import { reportServerError } from "@/lib/security/errors"
import { checkRateLimit } from "@/lib/security/rate-limit"
import { createClient } from "@/lib/supabase/server"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

const globalLocks = globalThis as typeof globalThis & {
  __srchrFavoritePinLocks?: Map<string, Promise<void>>
}
const pinLocks =
  globalLocks.__srchrFavoritePinLocks ?? new Map<string, Promise<void>>()
globalLocks.__srchrFavoritePinLocks = pinLocks

async function withUserLock<T>(userId: string, task: () => Promise<T>) {
  const previous = pinLocks.get(userId) ?? Promise.resolve()
  let release: () => void = () => {}
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  pinLocks.set(userId, current)
  await previous
  try {
    return await task()
  } finally {
    release()
    if (pinLocks.get(userId) === current) pinLocks.delete(userId)
  }
}

function isMissingPinFunction(error: { code?: string; message?: string }) {
  return error.code === "PGRST202" || error.code === "42883"
}

async function legacyPin(
  supabase: SupabaseClient,
  userId: string,
  favoriteId: string,
) {
  return withUserLock(userId, async () => {
    const { data: favorite, error: favoriteError } = await supabase
      .from("favorites")
      .select("id, is_pinned")
      .eq("id", favoriteId)
      .eq("user_id", userId)
      .maybeSingle()

    if (favoriteError) throw favoriteError
    if (!favorite) return { status: 404, error: "Favorite not found" }
    if (favorite.is_pinned) return { status: 200, favorite }

    const { count, error: countError } = await supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_pinned", true)
    if (countError) throw countError
    if ((count ?? 0) >= 4) {
      return {
        status: 409,
        error: "Можно закрепить не больше 4 карточек",
      }
    }

    const pinnedAt = new Date().toISOString()
    const { data, error } = await supabase
      .from("favorites")
      .update({ is_pinned: true, pinned_at: pinnedAt, updated_at: pinnedAt })
      .eq("id", favoriteId)
      .eq("user_id", userId)
      .select("*")
      .single()
    if (error) throw error
    return { status: 200, favorite: data }
  })
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimit = checkRateLimit(`favorites:pin:${user.id}`, 30, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    )
  }

  const { data, error } = await supabase.rpc("pin_favorite", {
    target_favorite_id: id,
  })
  if (!error) return NextResponse.json({ favorite: data })
  if (error.message.includes("favorite_pin_limit")) {
    return NextResponse.json(
      { error: "Можно закрепить не больше 4 карточек" },
      { status: 409 },
    )
  }
  if (error.message.includes("favorite_not_found")) {
    return NextResponse.json({ error: "Favorite not found" }, { status: 404 })
  }

  if (!isMissingPinFunction(error)) {
    reportServerError("api.favorites.pin.rpc", error)
    return NextResponse.json(
      { error: "Не удалось закрепить карточку" },
      { status: 500 },
    )
  }

  try {
    const result = await legacyPin(supabase, user.id, id)
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      )
    }
    return NextResponse.json({ favorite: result.favorite })
  } catch (fallbackError) {
    reportServerError("api.favorites.pin.fallback", fallbackError)
    return NextResponse.json(
      { error: "Не удалось закрепить карточку" },
      { status: 500 },
    )
  }
}
