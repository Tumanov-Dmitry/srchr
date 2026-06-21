"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createNotificationEvent, notifyAdmins } from "@/lib/notifications"
import { createSlug } from "@/lib/slug"
import { encodeMessage } from "@/lib/messages"
import { reportServerError } from "@/lib/security/errors"
import { createClient } from "@/lib/supabase/server"
import { getUserContentOwners } from "@/lib/supabase/queries"
import type { ContentOwner } from "@/types"

type PayloadValue = string | number | null | Record<string, unknown>
type MaterialOwnership = {
  company_id?: string | null
  organization_id?: string | null
  owner_type?: string | null
  expert_id?: string | null
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
  return ["draft", "moderation", "archived"].includes(status ?? "")
    ? status
    : "draft"
}

async function getSelectedOwner(formData: FormData) {
  const { user, owners } = await getUserContentOwners()
  const [ownerType, ownerId] = (value(formData, "owner") ?? "").split(":")
  const owner = owners.find(
    (item) => item.owner_type === ownerType && item.owner_id === ownerId,
  )

  return { user, owners, owner: owner ?? null }
}

function materialOwnerPayload(owner: ContentOwner) {
  const isExpert = owner.owner_type === "expert"

  return {
    owner_type: isExpert ? "expert" : "company",
    expert_id: isExpert ? owner.owner_id : null,
    company_id: isExpert ? null : owner.owner_id,
    organization_id: isExpert ? null : owner.owner_id,
  }
}

function canManageMaterial(
  ownership: MaterialOwnership,
  userId: string,
  owners: ContentOwner[],
) {
  if (ownership.created_by === userId) return true

  return owners.some((owner) => {
    if (owner.owner_type === "expert") {
      return ownership.expert_id === owner.owner_id
    }

    return (
      ownership.organization_id === owner.owner_id ||
      ownership.company_id === owner.owner_id
    )
  })
}

function getMissingColumn(error: { message?: string } | null) {
  const match = error?.message?.match(/'([^']+)' column/)
  return match?.[1]
}

function isMissingTable(error: { message?: string } | null) {
  const message = error?.message ?? ""
  return (
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  )
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
    typeof slug === "string" && slug.trim().length > 0
      ? slug.trim()
      : "material"

  return `${baseSlug}-${attempt + 2}`
}

async function createWriterClient() {
  return createClient()
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
    .select("company_id, organization_id, owner_type, expert_id, created_by")
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

function cmsContent(formData: FormData, type: "case" | "article") {
  const raw = value(formData, "content_json")
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (parsed.version !== 2 || !Array.isArray(parsed.blocks)) return null
    const blocks = parsed.blocks as Array<Record<string, unknown>>
    const meta =
      parsed.meta && typeof parsed.meta === "object"
        ? (parsed.meta as Record<string, unknown>)
        : {}

    return {
      ...parsed,
      version: 2,
      type,
      blocks,
      meta: {
        ...meta,
        category: value(formData, "category"),
        tags: tagsValue(formData) ?? null,
        client_name: value(formData, "client_name"),
        client_url: value(formData, "client_url"),
        industry: value(formData, "industry"),
        services: value(formData, type === "case" ? "services" : "service"),
        specialists: value(formData, "specialists"),
        project_team: value(formData, "project_team"),
        related_organizations: value(formData, "related_organizations"),
        related_experts: value(formData, "related_experts"),
        audience_question: value(formData, "audience_question"),
      },
    }
  } catch {
    return null
  }
}

function validateCmsContent(formData: FormData, type: "case" | "article") {
  const content = cmsContent(formData, type)
  if (!content) return false
  const blocks = content.blocks
  const hasContent = blocks.some((block) => {
    if (block.type === "section") return false
    const data = block.data
    if (!data || typeof data !== "object") return false
    if (block.type === "image") {
      const file = (data as Record<string, unknown>).file
      return Boolean(
        file &&
        typeof file === "object" &&
        "url" in file &&
        typeof file.url === "string" &&
        file.url.trim(),
      )
    }
    return Object.values(data).some((item) => {
      if (typeof item === "string") {
        return Boolean(item.replace(/<[^>]*>/g, "").trim())
      }
      if (Array.isArray(item)) return item.length > 0
      if (item && typeof item === "object") {
        return Object.keys(item).length > 0
      }
      return false
    })
  })
  if (!hasContent) return false
  if (type === "article") return true

  const sectionKeys = new Set(
    blocks
      .filter((block) => block.type === "section")
      .map((block) => {
        const data = block.data as Record<string, unknown> | undefined
        return typeof data?.key === "string" ? data.key : ""
      }),
  )
  return ["about", "work", "results"].every((key) => sectionKeys.has(key))
}

function buildCaseBlocks(formData: FormData) {
  return [
    { type: "task", title: "Задача", content: value(formData, "task") },
    { type: "context", title: "Контекст", content: value(formData, "context") },
    {
      type: "work",
      title: "Что сделали",
      content: value(formData, "work_done"),
    },
    {
      type: "team",
      title: "Команда проекта",
      content: value(formData, "project_team"),
    },
    {
      type: "solution",
      title: "Решение",
      content: value(formData, "solution"),
    },
    { type: "result", title: "Результат", content: value(formData, "result") },
    {
      type: "metrics",
      title: "Цифры / метрики",
      content: value(formData, "metrics"),
    },
    {
      type: "review",
      title: "Отзыв клиента",
      content: value(formData, "client_review"),
    },
    {
      type: "gallery",
      title: "Галерея / медиа",
      content: value(formData, "gallery"),
    },
    {
      type: "links",
      title: "Ссылки на результат",
      content: value(formData, "result_links"),
    },
  ].filter((block) => block.content)
}

function buildArticleBlocks(formData: FormData) {
  return [
    {
      type: "text",
      title: "Основной текст",
      content: value(formData, "content"),
    },
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
    redirectWithMessage(
      path,
      "Заполните обязательные поля для отправки на модерацию",
    )
  }
}

function redirectWithMessage(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?"
  redirect(`${path}${separator}message=${encodeMessage(message)}`)
}

function dashboardMediaPath(formData: FormData) {
  const storageKey = value(formData, "storage_key")
  return storageKey
    ? `/dashboard/media?draftKey=${encodeURIComponent(storageKey)}`
    : "/dashboard/media"
}

function caseContent(formData: FormData) {
  const cms = cmsContent(formData, "case")
  if (cms) return cms
  const blocks = buildCaseBlocks(formData)

  return {
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
  }
}

function articleContent(formData: FormData) {
  const cms = cmsContent(formData, "article")
  if (cms) return cms
  return {
    type: "article",
    blocks: buildArticleBlocks(formData),
  }
}

async function notifyAdminsAboutMaterialModeration({
  id,
  type,
  title,
  actorId,
}: {
  id: string
  type: "case" | "article"
  title: string
  actorId: string
}) {
  const typeLabel = type === "case" ? "кейс" : "статья"

  await createNotificationEvent({
    event_key: "material_moderation_requested",
    event_type: "material_moderation_requested",
    source: "materials",
    actor_id: actorId,
    target_type: type,
    target_id: id,
    title: `Новый материал на модерации: ${title}`,
    text: `Пользователь отправил ${typeLabel} на модерацию.`,
  })
  await notifyAdmins({
    title: `Новый материал на модерации`,
    text: `${title} (${typeLabel})`,
    type: "admin",
    target_type: type,
    target_id: id,
    target_url: `/admin/materials?target=${id}`,
  })
}

export async function createCaseMaterial(formData: FormData) {
  if (value(formData, "id")) return updateMaterial(formData)
  const { user, owner } = await getSelectedOwner(formData)

  if (!user) redirect("/login")
  if (!owner) {
    redirectWithMessage(
      "/dashboard/media/new/case",
      "Выберите эксперта или организацию-владельца",
    )
  }

  const status = statusValue(formData)
  const title = value(formData, "title") ?? "Новый кейс"

  if (status === "moderation") {
    redirectWithMissingFields("/dashboard/media/new/case", formData, [
      "title",
      "description",
      "category",
      "tags",
    ])
    if (!validateCmsContent(formData, "case")) {
      redirectWithMessage(
        "/dashboard/media/new/case",
        "Заполните контент и обязательные разделы кейса",
      )
    }
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
      ...materialOwnerPayload(owner),
      status,
      category: value(formData, "category"),
      tags: tagsValue(formData) ?? null,
      content,
      created_by: user.id,
      published_at: status === "published" ? new Date().toISOString() : null,
    })

    if (material && status === "moderation") {
      await notifyAdminsAboutMaterialModeration({
        id: material.id as string,
        type: "case",
        title,
        actorId: user.id,
      })
    }

    if (!material) {
      await writeLegacyCaseWithFallback({
        type: "case",
        title,
        slug,
        description: value(formData, "description"),
        short_description: value(formData, "description"),
        cover: value(formData, "cover_url"),
        cover_url: value(formData, "cover_url"),
        content: JSON.stringify(content),
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
        organization_id:
          owner.owner_type === "organization" ? owner.owner_id : null,
        company_id: owner.owner_type === "organization" ? owner.owner_id : null,
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
        content: JSON.stringify(content),
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
        organization_id:
          owner.owner_type === "organization" ? owner.owner_id : null,
        company_id: owner.owner_type === "organization" ? owner.owner_id : null,
        author_id: user.id,
        created_by: user.id,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
    }
  } catch (error) {
    reportServerError("media.createCase", error)
    redirectWithMessage(
      "/dashboard/media/new/case",
      "Не удалось сохранить кейс",
    )
  }

  revalidatePath("/media")
  revalidatePath("/cases")
  revalidatePath("/dashboard/media")
  redirectWithMessage(dashboardMediaPath(formData), "Кейс сохранен")
}

export async function createArticleMaterial(formData: FormData) {
  if (value(formData, "id")) return updateMaterial(formData)
  const { user, owner } = await getSelectedOwner(formData)

  if (!user) redirect("/login")
  if (!owner) {
    redirectWithMessage(
      "/dashboard/media/new/article",
      "Выберите эксперта или организацию-владельца",
    )
  }

  const status = statusValue(formData)
  const title = value(formData, "title") ?? "Новая статья"

  if (status === "moderation") {
    redirectWithMissingFields("/dashboard/media/new/article", formData, [
      "title",
      "description",
      "category",
      "tags",
    ])
    if (!validateCmsContent(formData, "article")) {
      redirectWithMessage(
        "/dashboard/media/new/article",
        "Добавьте содержимое статьи",
      )
    }
  }

  if (!title) {
    redirectWithMessage(
      "/dashboard/media/new/article",
      "Укажите название статьи",
    )
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
      ...materialOwnerPayload(owner),
      status,
      category: value(formData, "category"),
      tags: tagsValue(formData) ?? null,
      reading_time: numberValue(formData, "reading_time"),
      published_at:
        status === "published"
          ? new Date().toISOString()
          : value(formData, "published_at"),
      content: articleContent(formData),
      created_by: user.id,
    })
    materialSaved = Boolean(material)
    materialTableMissing = !material

    if (material && status === "moderation") {
      await notifyAdminsAboutMaterialModeration({
        id: material.id as string,
        type: "article",
        title,
        actorId: user.id,
      })
    }
  } catch (error) {
    reportServerError("media.createArticle", error)
    redirectWithMessage(
      "/dashboard/media/new/article",
      "Не удалось сохранить статью",
    )
  }

  if (!materialSaved || materialTableMissing) {
    redirectWithMessage(
      "/dashboard/media/new/article",
      "Для сохранения статей нужна таблица materials. Примените SQL из supabase/sql/create-materials.sql",
    )
  }

  revalidatePath("/dashboard/media")
  redirectWithMessage(dashboardMediaPath(formData), "Статья сохранена")
}

export async function updateMaterial(formData: FormData) {
  const { user, owners } = await getUserContentOwners()

  if (!user) redirect("/login")

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
      } else if (!canManageMaterial(ownership, user.id, owners)) {
        deleteError = "Нет доступа к этому материалу"
      } else {
        deleted = Boolean(await deleteWithSchemaFallback("materials", id))
      }
    } catch (error) {
      reportServerError("media.deleteDraft", error)
      redirectWithMessage(editPath, "Не удалось удалить черновик")
    }

    if (deleteError) {
      redirectWithMessage(editPath, deleteError)
    }

    if (!deleted) {
      redirectWithMessage(editPath, "Удалять можно только черновики")
    }

    revalidatePath("/dashboard/media")
    redirectWithMessage(dashboardMediaPath(formData), "Черновик удален")
  }

  if (status === "moderation") {
    redirectWithMissingFields(editPath, formData, [
      "title",
      "description",
      "category",
      "tags",
    ])
    if (!validateCmsContent(formData, type)) {
      redirectWithMessage(
        editPath,
        type === "case"
          ? "Заполните контент и обязательные разделы кейса"
          : "Добавьте содержимое статьи",
      )
    }
  }

  if (!title) {
    redirectWithMessage(editPath, "Укажите название материала")
  }

  let materialTableMissing = false
  let accessError: string | null = null

  try {
    const { owner } = await getSelectedOwner(formData)
    const ownership = await getMaterialOwnership(id)

    if (!ownership) {
      accessError = "Материал не найден или таблица materials недоступна"
    } else if (!canManageMaterial(ownership, user.id, owners)) {
      accessError = "Нет доступа к этому материалу"
    } else if (!owner) {
      accessError = "Выберите эксперта или организацию-владельца"
    }

    if (!accessError && owner) {
      const content =
        type === "case" ? caseContent(formData) : articleContent(formData)
      const updated = await updateWithSchemaFallback("materials", id, {
        title,
        description: value(formData, "description"),
        cover_url: value(formData, "cover_url"),
        author: value(formData, "author") ?? user.email ?? null,
        ...materialOwnerPayload(owner),
        status,
        category: value(formData, "category"),
        tags: tagsValue(formData) ?? null,
        reading_time: numberValue(formData, "reading_time"),
        content,
        updated_at: new Date().toISOString(),
        published_at: status === "published" ? new Date().toISOString() : null,
      })

      materialTableMissing = !updated

      if (updated && status === "moderation") {
        await notifyAdminsAboutMaterialModeration({
          id,
          type,
          title,
          actorId: user.id,
        })
      }
    }
  } catch (error) {
    reportServerError("media.update", error)
    redirectWithMessage(editPath, "Не удалось обновить материал")
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
  redirectWithMessage(dashboardMediaPath(formData), "Материал обновлен")
}
