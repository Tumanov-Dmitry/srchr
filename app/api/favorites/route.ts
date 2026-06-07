import { NextResponse } from "next/server"
import {
  buildFavoriteSnapshot,
  hydrateFavorites,
  isFavoriteTargetType,
  normalizeFavoriteTypeFilter,
  favoritePluralTypeMap,
} from "@/lib/favorites"
import { reportServerError } from "@/lib/security/errors"
import { checkRateLimit } from "@/lib/security/rate-limit"
import { createClient } from "@/lib/supabase/server"
import type { Favorite } from "@/types"

function isMissingTable(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? ""
  return (
    error?.code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("Could not find the table")
  )
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const type = normalizeFavoriteTypeFilter(url.searchParams.get("type"))
  const targetType = favoritePluralTypeMap[type]

  let query = supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .order("is_pinned", { ascending: false })
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (targetType) query = query.eq("target_type", targetType)

  const { data, error } = await query
  if (isMissingTable(error)) return NextResponse.json({ favorites: [] })
  if (error) {
    reportServerError("api.favorites.list", error)
    return NextResponse.json(
      { error: "Не удалось загрузить избранное" },
      { status: 500 },
    )
  }

  const favorites = await hydrateFavorites(supabase, (data ?? []) as Favorite[])
  return NextResponse.json({ favorites })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rateLimit = checkRateLimit(`favorites:create:${user.id}`, 30, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    )
  }

  const body = await request.json().catch(() => null)
  const targetType = body?.target_type
  const targetId = body?.target_id

  if (!isFavoriteTargetType(targetType) || typeof targetId !== "string") {
    return NextResponse.json(
      { error: "Invalid favorite target" },
      { status: 400 },
    )
  }

  const snapshotResult = await buildFavoriteSnapshot(
    supabase,
    targetType,
    targetId,
  )
  if (!snapshotResult) {
    return NextResponse.json({ error: "Object not found" }, { status: 404 })
  }

  const { data: existing, error: existingError } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle()

  if (isMissingTable(existingError)) {
    return NextResponse.json(
      { error: "Favorites table is not ready" },
      { status: 503 },
    )
  }

  if (existing) {
    return NextResponse.json({ favorite: existing, already_exists: true })
  }

  const { data, error } = await supabase
    .from("favorites")
    .insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      entity_type: targetType,
      entity_id: targetId,
      snapshot: snapshotResult.snapshot,
      status: snapshotResult.status,
    })
    .select("*")
    .single()

  if (error) {
    reportServerError("api.favorites.create", error)
    return NextResponse.json(
      { error: "Не удалось добавить в избранное" },
      { status: 500 },
    )
  }

  return NextResponse.json({ favorite: { ...data, href: snapshotResult.href } })
}
