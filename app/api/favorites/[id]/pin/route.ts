import { NextResponse } from "next/server"
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

  const { data: favorite, error: favoriteError } = await supabase
    .from("favorites")
    .select("id, is_pinned")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (favoriteError)
    return NextResponse.json({ error: favoriteError.message }, { status: 500 })
  if (!favorite)
    return NextResponse.json({ error: "Favorite not found" }, { status: 404 })
  if (favorite.is_pinned) return NextResponse.json({ favorite })

  const { count, error: countError } = await supabase
    .from("favorites")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_pinned", true)

  if (countError)
    return NextResponse.json({ error: countError.message }, { status: 500 })
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ favorite: data })
}
