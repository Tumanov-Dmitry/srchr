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

function autosaveSlug(title: string, id: string) {
  const base = createSlug(title || "material")
  return `${base}-${id.slice(0, 8)}`
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
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
  if (!isUuid(payload.id)) {
    return NextResponse.json(
      { error: "Некорректный идентификатор черновика" },
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

  const { data: existing, error: lookupError } = await supabase
    .from("materials")
    .select("id, status, created_by, organization_id, company_id, expert_id")
    .eq("id", payload.id)
    .maybeSingle()
  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 })
  }

  if (existing) {
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
      return NextResponse.json(
        {
          id: existing.id,
          error: "Материал уже отправлен на модерацию и не был изменён",
        },
        { status: 409 },
      )
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

  const slug = autosaveSlug(fields.title, payload.id)
  const { data, error } = await supabase
    .from("materials")
    .insert({
      id: payload.id,
      ...fields,
      slug,
      status: "draft",
      created_by: user.id,
    })
    .select("id, slug")
    .single()

  if (error?.code === "23505") {
    const { data: racedDraft } = await supabase
      .from("materials")
      .select("id, status")
      .eq("id", payload.id)
      .maybeSingle()
    if (racedDraft && ["draft", "rejected"].includes(racedDraft.status)) {
      const { error: retryError } = await supabase
        .from("materials")
        .update(fields)
        .eq("id", payload.id)
      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 })
      }
      return NextResponse.json({
        id: racedDraft.id,
        savedAt: new Date().toISOString(),
      })
    }
    if (racedDraft) {
      return NextResponse.json(
        {
          id: racedDraft.id,
          error: "Материал уже отправлен на модерацию и не был изменён",
        },
        { status: 409 },
      )
    }
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, savedAt: new Date().toISOString() })
}
