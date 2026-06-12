import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""
  if (query.length < 2) {
    return NextResponse.json({ organizations: [] })
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, city, logo_url, is_contractor, is_client, status")
    .ilike("name", `%${query.slice(0, 80)}%`)
    .limit(8)

  if (error) {
    return NextResponse.json(
      { error: "Не удалось выполнить поиск" },
      { status: 500 },
    )
  }

  return NextResponse.json({ organizations: data ?? [] })
}
