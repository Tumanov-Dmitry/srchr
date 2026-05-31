"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSlug } from "@/lib/slug"
import { encodeMessage } from "@/lib/messages"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getCurrentTenderOwnerOrganization } from "@/lib/supabase/queries"

type PayloadValue = string | number | null
type MaterialOwnership = {
  company_id?: string | null
  organization_id?: string | null
  created_by?: string | null
}

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

function isDuplicateSlug(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? ""

  return (
    error?.code === "23505" &&
    (message.includes("materials_slug_key") || message.includes("slug"))
  )
}

function uniqueSlugCandidate(slug: PayloadValue, attempt: number) {
  const baseSlug =
    typeof slug === "string" && slug.trim().length > 0 ? slug.trim() : "material"

  return `${baseSlug}-${attempt + 2}`
}

async function createWriterClient() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient()
}

async function writeWithSchemaFallback(
  table: string,
  payload: Record<string, PayloadValue>,
) {
  const supabase = await createWriterClient()
  const nextPayload = { ...payload }

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const { data, error } = await supabase
      .from(table)
      .insert(nextPayload)
      .select("id, slug")
      .single()

    if (!error) return data
    if (isMissingTable(error)) return null

    if (isDuplicateSlug(error) && "slug" in nextPayload) {
      nextPayload.slug = uniqueSlugCandidate(payload.slug, attempt)
      continue
    }

    const missingColumn = getMissingColumn(error)
    if (!missingColumn || !(missingColumn in nextPayload)) {
      throw new Error(error.message)
    }

    delete nextPayload[missingColumn]
  }

  throw new Error("Не удалось сохранить материал")
}

async function getMaterialOwnership(id: string) {
  const supabase = await createWriterClient()
  const { data, error } = await supabase
    .from("materials")
    .select("company_id, organization_id, created_by")
    .eq("id", id)
    .maybeSingle()

  if (isMissingTable(error)) return null
  if (error) throw new Error(error.message)

  return (data ?? null) as MaterialOwnership | null
}

async function updateWithSchemaFallback(
  table: string,
  id: string,
  payload: Record<string, PayloadValue>,
) {
  const supabase = await createWriterClient()
  const nextPayload = { ...payload }

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const { data, error } = await supabase
      .from(table)
      .update(nextPayload)
      .eq("id", id)
      .select("id, slug")
      .maybeSingle()

    if (!error) return data
    if (isMissingTable(error)) return null

    if (isDuplicateSlug(error) && "slug" in nextPayload) {
      nextPayload.slug = uniqueSlugCandidate(payload.slug, attempt)
      continue
    }

    const missingColumn = getMissingColumn(error)
    if (!missingColumn || !(missingColumn in nextPayload)) {
      throw new Error(error.message)
    }

    delete nextPayload[missingColumn]
  }

  throw new Error("Не удалось обновить материал")
}

async function deleteWithSchemaFallback(table: string, id: string) {
  const supabase = await createWriterClient()
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle()

  if (isMissingTable(error)) return null
  if (error) throw new Error(error.message)

  return data
}

async function writeMaterialWithFallback(
  payload: Record<string, PayloadValue>,
) {
  return writeWithSchemaFallback("materials", payload)
}

async function writeLegacyCaseWithFallback(
  payload: Record<string, PayloadValue>,
) {
  try {
    return await writeWithSchemaFallback("cases", payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : ""

    if (
      message.includes("status") &&
      (message.includes("check constraint") || message.includes("violates"))
    ) {
      return writeWithSchemaFallback("cases", {
        ...payload,
        status: "draft",
      })
    }

    throw error
  }
}

async function getAvailableSlug(table: string, title: string) {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient()
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

function missingRequired(formData: FormData, fields: string[]) {
  return fields.filter((field) => !value(formData, field))
}

function redirectWithMissingFields(
  path: string,
  formData: FormData,
  fields: string[],
) {
  const missing = missingRequired(formData, fields)

  if (missing.length > 0) {
    redirectWithMessage(path, "Заполните обязательные поля для отправки на модерацию")
  }
}

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeMessage(message)}`)
}

function caseContent(formData: FormData) {
  const blocks = buildCaseBlocks(formData)

  return JSON.stringify({
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
      tags: tagsValue(formData) ?? null,
    },
  })
}

function articleContent(formData: FormData) {
  return JSON.stringify({
    type: "article",
    blocks: buildArticleBlocks(formData),
  })
}

export async function createCaseMaterial(formData: FormData) {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")

  const status = statusValue(formData)
  const title = value(formData, "title") ?? "Новый кейс"

  if (status === "moderation") {
    redirectWithMissingFields("/dashboard/media/new/case", formData, [
      "title",
      "description",
      "category",
      "industry",
      "task",
      "work_done",
      "result",
    ])
  }

  if (!title) {
    redirectWithMessage("/dashboard/media/new/case", "Укажите название кейса")
  }

  try {
    const slug = await getAvailableSlug("materials", title)
    const content = caseContent(formData)

    const material = await writeMaterialWithFallback({
      type: "case",
      title,
      slug,
      description: value(formData, "description"),
      cover_url: value(formData, "cover_url"),
      author: user.email ?? null,
      company_id: organization.id,
      organization_id: organization.id,
      status,
      category: value(formData, "category"),
      tags: tagsValue(formData) ?? null,
      content,
      created_by: user.id,
      published_at: status === "published" ? new Date().toISOString() : null,
    })

    if (!material) {
      await writeLegacyCaseWithFallback({
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
    } else if (status === "published") {
      await writeLegacyCaseWithFallback({
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
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить кейс"
    redirectWithMessage("/dashboard/media/new/case", message)
  }

  revalidatePath("/cases")
  revalidatePath("/dashboard/media")
  redirectWithMessage("/dashboard/media", "Кейс сохранен")
}

export async function createArticleMaterial(formData: FormData) {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")

  const status = statusValue(formData)
  const title = value(formData, "title") ?? "Новая статья"

  if (status === "moderation") {
    redirectWithMissingFields("/dashboard/media/new/article", formData, [
      "title",
      "description",
      "category",
      "tags",
      "content",
    ])
  }

  if (!title) {
    redirectWithMessage("/dashboard/media/new/article", "Укажите название статьи")
  }

  let materialSaved = false
  let materialTableMissing = false

  try {
    const slug = await getAvailableSlug("materials", title)

    const material = await writeMaterialWithFallback({
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
      content: articleContent(formData),
      created_by: user.id,
    })
    materialSaved = Boolean(material)
    materialTableMissing = !material
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить статью"
    redirectWithMessage("/dashboard/media/new/article", message)
  }

  if (!materialSaved || materialTableMissing) {
    redirectWithMessage(
      "/dashboard/media/new/article",
      "Для сохранения статей нужна таблица materials. Примените SQL из supabase/sql/create-materials.sql",
    )
  }

  revalidatePath("/dashboard/media")
  redirectWithMessage("/dashboard/media", "Статья сохранена")
}

export async function updateMaterial(formData: FormData) {
  const { user, organization } = await getCurrentTenderOwnerOrganization()

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")

  const id = value(formData, "id")
  const type = value(formData, "type")
  const intent = value(formData, "intent") ?? "save"
  const status = statusValue(formData)
  const title = value(formData, "title")

  if (!id) redirectWithMessage("/dashboard/media", "Материал не найден")
  if (type !== "case" && type !== "article") {
    redirectWithMessage("/dashboard/media", "Неизвестный тип материала")
  }

  const editPath = `/dashboard/media/${id}/edit`

  if (intent === "delete") {
    let deleteError: string | null = null
    let deleted = false

    try {
      const ownership = await getMaterialOwnership(id)

      if (!ownership) {
        deleteError = "Материал не найден или таблица materials недоступна"
      } else if (
        ownership.company_id !== organization.id &&
        ownership.organization_id !== organization.id &&
        ownership.created_by !== user.id
      ) {
        deleteError = "Нет доступа к этому материалу"
      } else {
        deleted = Boolean(await deleteWithSchemaFallback("materials", id))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось удалить черновик"
      redirectWithMessage(editPath, message)
    }

    if (deleteError) {
      redirectWithMessage(editPath, deleteError)
    }

    if (!deleted) {
      redirectWithMessage(editPath, "Удалять можно только черновики")
    }

    revalidatePath("/dashboard/media")
    redirectWithMessage("/dashboard/media", "Черновик удален")
  }

  if (status === "moderation") {
    redirectWithMissingFields(
      editPath,
      formData,
      type === "case"
        ? ["title", "description", "category", "industry", "task", "work_done", "result"]
        : ["title", "description", "category", "tags", "content"],
    )
  }

  if (!title) {
    redirectWithMessage(editPath, "Укажите название материала")
  }

  let materialTableMissing = false
  let accessError: string | null = null

  try {
    const ownership = await getMaterialOwnership(id)

    if (!ownership) {
      accessError = "Материал не найден или таблица materials недоступна"
    } else if (
      ownership.company_id !== organization.id &&
      ownership.organization_id !== organization.id &&
      ownership.created_by !== user.id
    ) {
      accessError = "Нет доступа к этому материалу"
    }

    if (!accessError) {
      const content = type === "case" ? caseContent(formData) : articleContent(formData)
      const updated = await updateWithSchemaFallback("materials", id, {
        title,
        description: value(formData, "description"),
        cover_url: value(formData, "cover_url"),
        author: value(formData, "author") ?? user.email ?? null,
        company_id: organization.id,
        organization_id: organization.id,
        status,
        category: value(formData, "category"),
        tags: tagsValue(formData) ?? null,
        reading_time: numberValue(formData, "reading_time"),
        content,
        updated_at: new Date().toISOString(),
        published_at: status === "published" ? new Date().toISOString() : null,
      })

      materialTableMissing = !updated
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось обновить материал"
    redirectWithMessage(editPath, message)
  }

  if (accessError) {
    redirectWithMessage(editPath, accessError)
  }

  if (materialTableMissing) {
    redirectWithMessage(
      editPath,
      "Материал не найден или не был обновлен. Обновите страницу и попробуйте снова.",
    )
  }

  revalidatePath("/dashboard/media")
  revalidatePath(editPath)
  redirectWithMessage("/dashboard/media", "Материал обновлен")
}
