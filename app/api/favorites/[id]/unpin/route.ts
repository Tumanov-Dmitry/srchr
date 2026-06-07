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

  const rateLimit = checkRateLimit(`favorites:unpin:${user.id}`, 30, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    )
  }

  const { data, error } = await supabase
    .from("favorites")
    .update({
      is_pinned: false,
      pinned_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single()

  if (error) {
    reportServerError("api.favorites.unpin", error)
    return NextResponse.json(
      { error: "Не удалось открепить карточку" },
      { status: 500 },
    )
  }

  return NextResponse.json({ favorite: data })
}
