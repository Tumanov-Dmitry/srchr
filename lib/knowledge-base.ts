import "server-only"

import { cache } from "react"
import { promises as fs } from "node:fs"
import path from "node:path"

export type KnowledgeStatus = "active" | "beta" | "planned" | "deprecated"

export type KnowledgeModule = {
  slug: string
  title: string
  summary: string
  category: string
  status: KnowledgeStatus
  updatedAt: string
  owners: string[]
  tags: string[]
  dependsOn: string[]
}

export type KnowledgeHeading = {
  depth: number
  id: string
  title: string
}

export type KnowledgeDocument = KnowledgeModule & {
  content: string
  headings: KnowledgeHeading[]
}

const modulesDirectory = path.join(process.cwd(), "docs", "modules")
const indexPath = path.join(modulesDirectory, "index.json")

function headingId(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
}

function extractHeadings(content: string): KnowledgeHeading[] {
  return content.split(/\r?\n/).flatMap((line) => {
    const match = /^(#{2,3})\s+(.+)$/.exec(line)

    if (!match) {
      return []
    }

    return [
      {
        depth: match[1].length,
        id: headingId(match[2]),
        title: match[2],
      },
    ]
  })
}

export const getKnowledgeModules = cache(async () => {
  const rawIndex = await fs.readFile(indexPath, "utf8")
  const modules = JSON.parse(rawIndex) as KnowledgeModule[]

  return modules.sort((left, right) => {
    const category = left.category.localeCompare(right.category, "ru")
    return category || left.title.localeCompare(right.title, "ru")
  })
})

export const getKnowledgeDocument = cache(async (slug: string) => {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return null
  }

  const modules = await getKnowledgeModules()
  const metadata = modules.find((item) => item.slug === slug)

  if (!metadata) {
    return null
  }

  const content = await fs.readFile(
    path.join(modulesDirectory, `${slug}.md`),
    "utf8",
  )

  return {
    ...metadata,
    content,
    headings: extractHeadings(content),
  } satisfies KnowledgeDocument
})

export function getKnowledgeStatusLabel(status: KnowledgeStatus) {
  const labels: Record<KnowledgeStatus, string> = {
    active: "Работает",
    beta: "Beta",
    planned: "Запланировано",
    deprecated: "Устаревает",
  }

  return labels[status]
}
