"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSlug } from "@/lib/slug"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenderOwnerOrganization } from "@/lib/supabase/queries"

type PayloadValue = string | number | null

function value(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim()
  return raw.length > 0 ? raw : null
}

function numberValue(formData: FormData, key: string) {
  const raw = value(formData, key)
  if (!raw) return null

  const number = Number(raw)
  return Number.isFinite(number) && number > 0 ? number : null
}

function statusValue(formData: FormData) {
  const status = value(formData, "status")
  return ["draft", "moderation", "published", "rejected", "archived"].includes(
    status ?? "",
  )
    ? status
    : "draft"
}

function getMissingColumn(error: { message?: string } | null) {
  const match = error?.message?.match(/'([^']+)' column/)
  return match?.[1]
}

function isMissingTable(error: { message?: string } | null) {
  const message = error?.message ?? ""
  return message.includes("Could not find the table") || message.includes("does not exist")
}

async function writeWithSchemaFallback(
  table: string,
  payload: Record<string, PayloadValue>,
) {
  const supabase = await createClient()
  const nextPayload = { ...payload }

  for (let attempt = 0; attempt < 14; attempt += 1) {
    const { data, error } = await supabase
      .from(table)
      .insert(nextPayload)
      .select("id, slug")
      .single()

    if (!error) return data
    if (isMissingTable(error)) return null

    const missingColumn = getMissingColumn(error)
    if (!missingColumn || !(missingColumn in nextPayload)) {
      throw new Error(error.message)
    }

    delete nextPayload[missingColumn]
  }

  throw new Error("Не удалось сохранить материал")
}

async function getAvailableSlug(table: string, title: string) {
  const supabase = await createClient()
  const baseSlug = createSlug(title)
  let candidate = baseSlug

  for (let index = 0; index < 20; index += 1) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()

    if (isMissingTable(error)) return candidate
    if (!data) return candidate

    candidate = `${baseSlug}-${index + 2}`
  }

  return `${baseSlug}-${Date.now().toString(36)}`
}

function tagsValue(formData: FormData) {
  return value(formData, "tags")
    ?.split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(", ")
}

function buildCaseBlocks(formData: FormData) {
  return [
    { type: "task", title: "Задача", content: value(formData, "task") },
    { type: "context", title: "Контекст", content: value(formData, "context") },
    { type: "work", title: "Что сделали", content: value(formData, "work_done") },
    { type: "team", title: "Команда проекта", content: value(formData, "project_team") },
    { type: "solution", title: "Решение", content: value(formData, "solution") },
    { type: "result", title: "Результат", content: value(formData, "result") },
    { type: "metrics", title: "Цифры / метрики", content: value(formData, "metrics") },
    { type: "review", title: "Отзыв клиента", content: value(formData, "client_review") },
    { type: "gallery", title: "Галерея / медиа", content: value(formData, "gallery") },
    { type: "links", title: "Ссылки на результат", content: value(formData, "result_links") },
  ].filter((block) => block.content)
}

function buildArticleBlocks(formData: FormData) {
  return [
    { type: "text", title: "Основной текст", content: value(formData, "content") },
    { type: "quote", title: "Цитата", content: value(formData, "quote") },
    { type: "cta", title: "CTA-блок", content: value(formData, "cta") },
  ].filter((block) => block.content)
}

export async function createCaseMaterial(formData: FormData) {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")

  const title = value(formData, "title")
  if (!title) {
    redirect("/dashboard/media/new/case?message=Укажите название кейса")
  }

  const status = statusValue(formData)
  const slug = await getAvailableSlug("cases", title)
  const blocks = buildCaseBlocks(formData)
  const content = JSON.stringify({
    type: "case",
    blocks,
    meta: {
      category: value(formData, "category"),
      industry: value(formData, "industry"),
      city: value(formData, "city"),
      project_year: numberValue(formData, "project_year"),
      client_name: value(formData, "client_name"),
      client_url: value(formData, "client_url"),
      client_name_visible: value(formData, "client_name_visible") ?? "yes",
      services: value(formData, "services"),
      specialists: value(formData, "specialists"),
      tools: value(formData, "tools"),
      project_duration: value(formData, "project_duration"),
      budget_range: value(formData, "budget_range"),
      tags: tagsValue(formData),
    },
  })

  try {
    await writeWithSchemaFallback("cases", {
      type: "case",
      title,
      slug,
      description: value(formData, "description"),
      short_description: value(formData, "description"),
      cover: value(formData, "cover_url"),
      cover_url: value(formData, "cover_url"),
      content,
      status,
      category: value(formData, "category"),
      service: value(formData, "category"),
      industry: value(formData, "industry"),
      city: value(formData, "city"),
      project_year: numberValue(formData, "project_year"),
      client_name: value(formData, "client_name"),
      client_url: value(formData, "client_url"),
      budget_range: value(formData, "budget_range"),
      tags: tagsValue(formData) ?? null,
      organization_id: organization.id,
      company_id: organization.id,
      author_id: user.id,
      created_by: user.id,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить кейс"
    redirect(`/dashboard/media/new/case?message=${encodeURIComponent(message)}`)
  }

  revalidatePath("/cases")
  revalidatePath("/dashboard/media")
  redirect("/dashboard/media?message=Кейс сохранен")
}

export async function createArticleMaterial(formData: FormData) {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")

  const title = value(formData, "title")
  if (!title) {
    redirect("/dashboard/media/new/article?message=Укажите название статьи")
  }

  const status = statusValue(formData)
  const slug = await getAvailableSlug("materials", title)
  const blocks = buildArticleBlocks(formData)
  let materialSaved = false

  try {
    const material = await writeWithSchemaFallback("materials", {
      type: "article",
      title,
      slug,
      description: value(formData, "description"),
      cover_url: value(formData, "cover_url"),
      author: value(formData, "author") ?? user.email ?? null,
      company_id: organization.id,
      organization_id: organization.id,
      status,
      category: value(formData, "category"),
      tags: tagsValue(formData) ?? null,
      reading_time: numberValue(formData, "reading_time"),
      published_at: status === "published" ? new Date().toISOString() : value(formData, "published_at"),
      content: JSON.stringify({ type: "article", blocks }),
      created_by: user.id,
    })
    materialSaved = Boolean(material)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить статью"
    redirect(`/dashboard/media/new/article?message=${encodeURIComponent(message)}`)
  }

  if (!materialSaved) {
    redirect(
      "/dashboard/media/new/article?message=Для сохранения статей примените SQL из supabase/sql/create-materials.sql",
    )
  }

  revalidatePath("/dashboard/media")
  redirect("/dashboard/media?message=Статья сохранена")
}
