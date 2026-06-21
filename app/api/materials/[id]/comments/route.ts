import { NextResponse } from "next/server"

import { reportServerError } from "@/lib/security/errors"
import { checkRateLimit, getRequestIdentifier } from "@/lib/security/rate-limit"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 })

  const limit = checkRateLimit(
    `material-comment:${user.id}:${getRequestIdentifier(request.headers)}`,
    10,
    60_000,
  )
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Слишком много комментариев" },
      { status: 429 },
    )

  const { id } = await params
  const payload = (await request.json()) as { body?: unknown }
  const body = typeof payload.body === "string" ? payload.body.trim() : ""
  if (!body || body.length > 2000) {
    return NextResponse.json(
      { error: "Комментарий должен содержать от 1 до 2000 символов" },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("material_comments")
    .insert({ material_id: id, user_id: user.id, body })
    .select("id, body, created_at")
    .single()
  if (error) {
    reportServerError("materials.comment.create", error)
    return NextResponse.json(
      { error: "Не удалось добавить комментарий" },
      { status: 400 },
    )
  }
  return NextResponse.json({ comment: data }, { status: 201 })
}
