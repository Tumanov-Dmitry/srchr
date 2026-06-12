import { NextResponse } from "next/server"
import { reportServerError } from "@/lib/security/errors"
import { checkRateLimit } from "@/lib/security/rate-limit"
import { createClient } from "@/lib/supabase/server"

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("favorite_collections")
    .select("*, favorite_collection_items(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    reportServerError("api.favoriteCollections.list", error)
    return NextResponse.json(
      { error: "Не удалось загрузить коллекции" },
      { status: 500 },
    )
  }

  return NextResponse.json({
    collections: (data ?? []).map((collection) => ({
      ...collection,
      items_count: collection.favorite_collection_items?.[0]?.count ?? 0,
      favorite_collection_items: undefined,
    })),
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimit = checkRateLimit(
    `favorite-collections:create:${user.id}`,
    20,
    60_000,
  )
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов" },
      { status: 429 },
    )
  }

  const body = await request.json().catch(() => null)
  const name = text(body?.name, 80)

  if (!name) {
    return NextResponse.json(
      { error: "Укажите название коллекции" },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("favorite_collections")
    .insert({
      user_id: user.id,
      name,
      description: text(body?.description, 500) || null,
      icon: text(body?.icon, 40) || null,
      color: text(body?.color, 24) || null,
    })
    .select("*")
    .single()

  if (error) {
    reportServerError("api.favoriteCollections.create", error)
    return NextResponse.json(
      {
        error:
          error.code === "23505"
            ? "Коллекция с таким названием уже есть"
            : "Не удалось создать коллекцию",
      },
      { status: error.code === "23505" ? 409 : 500 },
    )
  }

  return NextResponse.json({ collection: { ...data, items_count: 0 } })
}
