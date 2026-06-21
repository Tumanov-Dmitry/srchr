import { NextResponse } from "next/server"

import {
  materialReactionOptions,
  type MaterialReactionKey,
} from "@/lib/material-engagement"
import { reportServerError } from "@/lib/security/errors"
import { createClient } from "@/lib/supabase/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 })

  const { id } = await params
  const payload = (await request.json()) as { reaction?: unknown }
  const reaction = payload.reaction as MaterialReactionKey
  if (!materialReactionOptions.some((item) => item.key === reaction)) {
    return NextResponse.json({ error: "Неизвестная реакция" }, { status: 400 })
  }

  const { data: current } = await supabase
    .from("material_reactions")
    .select("id, reaction")
    .eq("material_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (current?.reaction === reaction) {
    const { error } = await supabase
      .from("material_reactions")
      .delete()
      .eq("id", current.id)
    if (error) {
      reportServerError("materials.reaction.delete", error)
      return NextResponse.json(
        { error: "Не удалось удалить реакцию" },
        { status: 400 },
      )
    }
    return NextResponse.json({ reaction: null })
  }

  const { error } = await supabase.from("material_reactions").upsert(
    {
      material_id: id,
      user_id: user.id,
      reaction,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "material_id,user_id" },
  )
  if (error) {
    reportServerError("materials.reaction.save", error)
    return NextResponse.json(
      { error: "Не удалось сохранить реакцию" },
      { status: 400 },
    )
  }
  return NextResponse.json({ reaction })
}
