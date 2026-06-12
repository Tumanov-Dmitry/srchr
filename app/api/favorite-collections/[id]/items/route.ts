import { NextResponse } from "next/server"
import { reportServerError } from "@/lib/security/errors"
import { createClient } from "@/lib/supabase/server"

async function getContext(collectionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, collection: null }

  const { data: collection } = await supabase
    .from("favorite_collections")
    .select("id")
    .eq("id", collectionId)
    .eq("user_id", user.id)
    .maybeSingle()

  return { supabase, user, collection }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { supabase, user, collection } = await getContext(id)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!collection) {
    return NextResponse.json({ error: "Коллекция не найдена" }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const favoriteId =
    typeof body?.favorite_id === "string" ? body.favorite_id : ""
  if (!favoriteId) {
    return NextResponse.json({ error: "Favorite is required" }, { status: 400 })
  }

  const { data: favorite } = await supabase
    .from("favorites")
    .select("id")
    .eq("id", favoriteId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!favorite) {
    return NextResponse.json({ error: "Избранное не найдено" }, { status: 404 })
  }

  const { error } = await supabase
    .from("favorite_collection_items")
    .upsert(
      { collection_id: id, favorite_id: favoriteId },
      { onConflict: "collection_id,favorite_id" },
    )

  if (error) {
    reportServerError("api.favoriteCollections.items.add", error)
    return NextResponse.json(
      { error: "Не удалось добавить в коллекцию" },
      { status: 500 },
    )
  }

  await supabase
    .from("favorite_collections")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id)

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { supabase, user, collection } = await getContext(id)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!collection) {
    return NextResponse.json({ error: "Коллекция не найдена" }, { status: 404 })
  }

  const favoriteId = new URL(request.url).searchParams.get("favorite_id")
  if (!favoriteId) {
    return NextResponse.json({ error: "Favorite is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("favorite_collection_items")
    .delete()
    .eq("collection_id", id)
    .eq("favorite_id", favoriteId)

  if (error) {
    reportServerError("api.favoriteCollections.items.delete", error)
    return NextResponse.json(
      { error: "Не удалось убрать из коллекции" },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
