import { NextResponse } from "next/server"
import { reportServerError } from "@/lib/security/errors"
import { createClient } from "@/lib/supabase/server"

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
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
    .update({
      name,
      description: text(body?.description, 500) || null,
      icon: text(body?.icon, 40) || null,
      color: text(body?.color, 24) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle()

  if (error) {
    reportServerError("api.favoriteCollections.update", error)
    return NextResponse.json(
      { error: "Не удалось обновить коллекцию" },
      { status: 500 },
    )
  }
  if (!data) {
    return NextResponse.json({ error: "Коллекция не найдена" }, { status: 404 })
  }

  return NextResponse.json({ collection: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { error } = await supabase
    .from("favorite_collections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    reportServerError("api.favoriteCollections.delete", error)
    return NextResponse.json(
      { error: "Не удалось удалить коллекцию" },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
