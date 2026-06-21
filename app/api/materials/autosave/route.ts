import { NextResponse } from "next/server"

import { createSlug } from "@/lib/slug"
import { createClient } from "@/lib/supabase/server"
import { getUserContentOwners } from "@/lib/supabase/queries"

type AutosavePayload = {
  id?: string | null
  type?: "case" | "article"
  title?: string
  description?: string
  cover_url?: string
  category?: string
  tags?: string
  owner?: string
  author?: string
  content?: unknown
}

function ownerFields(owner: string) {
  const [type, id] = owner.split(":")
  return type === "expert"
    ? {
        owner_type: "expert",
        expert_id: id,
        company_id: null,
        organization_id: null,
      }
    : {
        owner_type: "company",
        expert_id: null,
        company_id: id,
        organization_id: id,
      }
}

async function availableSlug(title: string) {
  const supabase = await createClient()
  const base = createSlug(title || "material")
  let slug = base
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data } = await supabase
      .from("materials")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
    if (!data) return slug
    slug = `${base}-${attempt + 2}`
  }
  return `${base}-${Date.now().toString(36)}`
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AutosavePayload
  const { user, owners } = await getUserContentOwners()

  if (!user) {
    return NextResponse.json(
      { error: "Требуется авторизация" },
      { status: 401 },
    )
  }
  if (payload.type !== "case" && payload.type !== "article") {
    return NextResponse.json(
      { error: "Неизвестный тип материала" },
      { status: 400 },
    )
  }

  const selectedOwner = owners.find(
    (owner) => `${owner.owner_type}:${owner.owner_id}` === payload.owner,
  )
  if (!selectedOwner) {
    return NextResponse.json(
      { error: "Выберите автора материала" },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const fields = {
    type: payload.type,
    title:
      payload.title?.trim() ||
      (payload.type === "case" ? "Новый кейс" : "Новая статья"),
    description: payload.description?.trim() || null,
    cover_url: payload.cover_url?.trim() || null,
    category: payload.category?.trim() || null,
    tags: payload.tags?.trim() || null,
    author: payload.author?.trim() || user.email || null,
    content: payload.content ?? {},
    ...ownerFields(payload.owner ?? ""),
    updated_at: new Date().toISOString(),
  }

  if (payload.id) {
    const { data: existing } = await supabase
      .from("materials")
      .select("id, status, created_by, organization_id, company_id, expert_id")
      .eq("id", payload.id)
      .maybeSingle()
    const canManage =
      existing?.created_by === user.id ||
      owners.some((owner) =>
        owner.owner_type === "expert"
          ? existing?.expert_id === owner.owner_id
          : existing?.organization_id === owner.owner_id ||
            existing?.company_id === owner.owner_id,
      )

    if (!existing || !canManage) {
      return NextResponse.json(
        { error: "Нет доступа к материалу" },
        { status: 403 },
      )
    }
    if (!["draft", "rejected"].includes(existing.status ?? "draft")) {
      return NextResponse.json({ id: existing.id, skipped: true })
    }

    const { error } = await supabase
      .from("materials")
      .update(fields)
      .eq("id", payload.id)
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      id: payload.id,
      savedAt: new Date().toISOString(),
    })
  }

  const slug = await availableSlug(fields.title)
  const { data, error } = await supabase
    .from("materials")
    .insert({
      ...fields,
      slug,
      status: "draft",
      created_by: user.id,
    })
    .select("id, slug")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, savedAt: new Date().toISOString() })
}
