import { NextResponse } from "next/server"
import { reportServerError } from "@/lib/security/errors"
import { checkRateLimit } from "@/lib/security/rate-limit"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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

  const { data: favorite, error: favoriteError } = await supabase
    .from("favorites")
    .select("id, is_pinned")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (favoriteError) {
    reportServerError("api.favorites.pin.lookup", favoriteError)
    return NextResponse.json(
      { error: "Не удалось загрузить избранное" },
      { status: 500 },
    )
  }
  if (!favorite)
    return NextResponse.json({ error: "Favorite not found" }, { status: 404 })
  if (favorite.is_pinned) return NextResponse.json({ favorite })

  const { count, error: countError } = await supabase
    .from("favorites")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_pinned", true)

  if (countError) {
    reportServerError("api.favorites.pin.count", countError)
    return NextResponse.json(
      { error: "Не удалось проверить закреплённые карточки" },
      { status: 500 },
    )
  }
  if ((count ?? 0) >= 4) {
    return NextResponse.json(
      { error: "Можно закрепить не больше 4 карточек" },
      { status: 409 },
    )
  }

  const pinnedAt = new Date().toISOString()
  const { data, error } = await supabase
    .from("favorites")
    .update({ is_pinned: true, pinned_at: pinnedAt, updated_at: pinnedAt })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single()

  if (error) {
    reportServerError("api.favorites.pin", error)
    return NextResponse.json(
      { error: "Не удалось закрепить карточку" },
      { status: 500 },
    )
  }

  return NextResponse.json({ favorite: data })
}
