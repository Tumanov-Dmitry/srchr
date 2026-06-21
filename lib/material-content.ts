import type { Material } from "@/types"

export type MaterialBlock = {
  id?: string
  type: string
  data: Record<string, unknown>
}

export type MaterialDocument = {
  version: 2
  type: "case" | "article"
  time?: number
  blocks: MaterialBlock[]
  meta?: Record<string, unknown>
}

type LegacyBlock = {
  type?: string
  title?: string | null
  content?: string | null
}

type LegacyContent = {
  type?: "case" | "article"
  blocks?: LegacyBlock[]
  meta?: Record<string, unknown>
}

export const caseRequiredSections = [
  { key: "about", title: "О проекте" },
  { key: "work", title: "Что сделали" },
  { key: "results", title: "Результаты" },
] as const

function paragraph(text: string): MaterialBlock {
  return { type: "paragraph", data: { text } }
}

function section(key: string, title: string): MaterialBlock {
  return { type: "section", data: { key, title } }
}

export function createEmptyMaterialDocument(
  type: "case" | "article",
): MaterialDocument {
  if (type === "article") {
    return {
      version: 2,
      type,
      blocks: [paragraph("")],
      meta: {},
    }
  }

  return {
    version: 2,
    type,
    blocks: caseRequiredSections.flatMap((item) => [
      section(item.key, item.title),
      paragraph(""),
    ]),
    meta: {},
  }
}

function legacyBlocksToEditor(blocks: LegacyBlock[], type: "case" | "article") {
  if (type === "case") {
    const groups = [
      {
        key: "about",
        title: "О проекте",
        legacy: ["task", "context"],
      },
      {
        key: "work",
        title: "Что сделали",
        legacy: ["work", "team", "solution"],
      },
      {
        key: "results",
        title: "Результаты",
        legacy: ["result", "metrics", "review", "gallery", "links"],
      },
    ]

    return groups.flatMap((group) => {
      const groupBlocks = blocks.filter((block) =>
        group.legacy.includes(block.type ?? ""),
      )
      return [
        section(group.key, group.title),
        ...groupBlocks.flatMap((block) => [
          ...(block.title
            ? [{ type: "header", data: { text: block.title, level: 3 } }]
            : []),
          ...(block.content ? [paragraph(block.content)] : []),
        ]),
      ]
    })
  }

  return blocks.flatMap((block) => [
    ...(block.title && block.title !== "Основной текст"
      ? [{ type: "header", data: { text: block.title, level: 2 } }]
      : []),
    ...(block.content
      ? [
          block.type === "quote"
            ? { type: "quote", data: { text: block.content, caption: "" } }
            : paragraph(block.content),
        ]
      : []),
  ])
}

export function parseMaterialDocument(
  material: Pick<Material, "type" | "content">,
): MaterialDocument {
  if (!material.content) return createEmptyMaterialDocument(material.type)

  let parsed: unknown = material.content
  if (typeof material.content === "string") {
    try {
      parsed = JSON.parse(material.content)
    } catch {
      return {
        ...createEmptyMaterialDocument(material.type),
        blocks: [paragraph(material.content)],
      }
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return createEmptyMaterialDocument(material.type)
  }

  const record = parsed as Record<string, unknown>
  if (record.version === 2 && Array.isArray(record.blocks)) {
    return {
      version: 2,
      type: material.type,
      time: typeof record.time === "number" ? record.time : undefined,
      blocks: record.blocks.filter((block): block is MaterialBlock =>
        Boolean(
          block &&
          typeof block === "object" &&
          typeof (block as MaterialBlock).type === "string" &&
          (block as MaterialBlock).data,
        ),
      ),
      meta:
        record.meta && typeof record.meta === "object"
          ? (record.meta as Record<string, unknown>)
          : {},
    }
  }

  const legacy = record as LegacyContent
  if (Array.isArray(legacy.blocks)) {
    return {
      version: 2,
      type: material.type,
      blocks: legacyBlocksToEditor(legacy.blocks, material.type),
      meta: legacy.meta ?? {},
    }
  }

  return createEmptyMaterialDocument(material.type)
}

function hasBlockContent(block: MaterialBlock) {
  if (block.type === "image") {
    const file = block.data.file
    return Boolean(
      file &&
      typeof file === "object" &&
      "url" in file &&
      typeof file.url === "string" &&
      file.url.trim(),
    )
  }
  if (block.type === "gallery") {
    return Array.isArray(block.data.images) && block.data.images.length > 0
  }
  return Object.values(block.data).some(
    (value) =>
      typeof value === "string" && value.replace(/<[^>]*>/g, "").trim(),
  )
}

export function getMissingCaseSections(document: MaterialDocument) {
  const present = new Set(
    document.blocks
      .filter((block) => block.type === "section")
      .map((block) => String(block.data.key ?? "")),
  )
  return caseRequiredSections.filter((item) => !present.has(item.key))
}

export function calculateMaterialQuality({
  type,
  title,
  description,
  coverUrl,
  category,
  tags,
  owner,
  document,
}: {
  type: "case" | "article"
  title: string
  description: string
  coverUrl: string
  category: string
  tags: string
  owner: string
  document: MaterialDocument
}) {
  const checks = [
    { label: "обложка", complete: Boolean(coverUrl.trim()) },
    { label: "заголовок", complete: Boolean(title.trim()) },
    { label: "описание", complete: Boolean(description.trim()) },
    { label: "категория", complete: Boolean(category.trim()) },
    { label: "теги", complete: Boolean(tags.trim()) },
    { label: "автор", complete: Boolean(owner.trim()) },
    {
      label: "контент",
      complete: document.blocks.some(
        (block) => block.type !== "section" && hasBlockContent(block),
      ),
    },
    ...(type === "case"
      ? [
          {
            label: "обязательные разделы",
            complete: getMissingCaseSections(document).length === 0,
          },
        ]
      : []),
  ]
  const completed = checks.filter((item) => item.complete).length

  return {
    percent: Math.round((completed / checks.length) * 100),
    missing: checks.filter((item) => !item.complete).map((item) => item.label),
  }
}
