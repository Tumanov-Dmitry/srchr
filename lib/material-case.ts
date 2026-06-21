import type { MaterialBlock, MaterialDocument } from "@/lib/material-content"

export type CaseTeamMember = {
  id: string
  photoUrl: string
  name: string
  position: string
  company: string
}

export type CaseAward = {
  id: string
  title: string
  url: string
}

export type CaseWizardData = {
  projectAbout: string
  projectUrl: string
  serviceNames: string[]
  duration: string
  budget: string
  hideBudget: boolean
  clientName: string
  clientLogoUrl: string
  hideClient: boolean
  introMediaUrl: string
  task: string
  solution: string
  result: string
  teamComment: string
  teamCommentAuthor: string
  team: CaseTeamMember[]
  awards: CaseAward[]
}

const emptyData: CaseWizardData = {
  projectAbout: "",
  projectUrl: "",
  serviceNames: [],
  duration: "",
  budget: "",
  hideBudget: false,
  clientName: "",
  clientLogoUrl: "",
  hideClient: false,
  introMediaUrl: "",
  task: "",
  solution: "",
  result: "",
  teamComment: "",
  teamCommentAuthor: "",
  team: [],
  awards: [],
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

function booleanValue(value: unknown) {
  return value === true || value === "true"
}

function arrayValue(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function teamValue(value: unknown): CaseTeamMember[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const row = item as Record<string, unknown>
    return [
      {
        id: stringValue(row.id) || crypto.randomUUID(),
        photoUrl: stringValue(row.photoUrl),
        name: stringValue(row.name),
        position: stringValue(row.position),
        company: stringValue(row.company),
      },
    ]
  })
}

function awardsValue(value: unknown): CaseAward[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const row = item as Record<string, unknown>
    return [
      {
        id: stringValue(row.id) || crypto.randomUUID(),
        title: stringValue(row.title),
        url: stringValue(row.url),
      },
    ]
  })
}

function blockHtml(document: MaterialDocument, sectionKey: string) {
  const sectionIndex = document.blocks.findIndex(
    (block) => block.type === "section" && block.data.key === sectionKey,
  )
  if (sectionIndex < 0) return ""

  return (
    (document.blocks
      .slice(sectionIndex + 1)
      .find((block) => block.type !== "section")?.data.text as string) ?? ""
  )
}

export function getCaseWizardData(document: MaterialDocument): CaseWizardData {
  const meta = document.meta ?? {}
  const wizard =
    meta.case_wizard && typeof meta.case_wizard === "object"
      ? (meta.case_wizard as Record<string, unknown>)
      : null

  if (!wizard) {
    return {
      ...emptyData,
      projectAbout: blockHtml(document, "about"),
      task: blockHtml(document, "about"),
      solution: blockHtml(document, "work"),
      result: blockHtml(document, "results"),
      serviceNames: arrayValue(meta.services).length
        ? arrayValue(meta.services)
        : stringValue(meta.services)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
      clientName: stringValue(meta.client_name),
      projectUrl: stringValue(meta.client_url),
      duration: stringValue(meta.project_duration),
      budget: stringValue(meta.budget_range),
    }
  }

  return {
    projectAbout: stringValue(wizard.projectAbout),
    projectUrl: stringValue(wizard.projectUrl),
    serviceNames: arrayValue(wizard.serviceNames),
    duration: stringValue(wizard.duration),
    budget: stringValue(wizard.budget),
    hideBudget: booleanValue(wizard.hideBudget),
    clientName: stringValue(wizard.clientName),
    clientLogoUrl: stringValue(wizard.clientLogoUrl),
    hideClient: booleanValue(wizard.hideClient),
    introMediaUrl: stringValue(wizard.introMediaUrl),
    task: stringValue(wizard.task),
    solution: stringValue(wizard.solution),
    result: stringValue(wizard.result),
    teamComment: stringValue(wizard.teamComment),
    teamCommentAuthor: stringValue(wizard.teamCommentAuthor),
    team: teamValue(wizard.team),
    awards: awardsValue(wizard.awards),
  }
}

function section(key: string, title: string): MaterialBlock {
  return { type: "section", data: { key, title } }
}

function paragraph(text: string): MaterialBlock {
  return { type: "paragraph", data: { text } }
}

export function createCaseWizardDocument(
  document: MaterialDocument,
  data: CaseWizardData,
): MaterialDocument {
  return {
    ...document,
    version: 2,
    type: "case",
    blocks: [
      section("about", "О проекте"),
      paragraph(data.projectAbout),
      section("task", "Задача"),
      paragraph(data.task),
      section("solution", "Решение"),
      paragraph(data.solution),
      section("results", "Результат"),
      paragraph(data.result),
    ],
    meta: {
      ...document.meta,
      editor: "case-wizard-v1",
      services: data.serviceNames,
      client_name: data.clientName,
      project_duration: data.duration,
      budget_range: data.budget,
      case_wizard: data,
    },
  }
}

export function plainText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

export function caseDescription(projectAbout: string) {
  const text = plainText(projectAbout)
  return text.length > 240 ? `${text.slice(0, 237).trimEnd()}...` : text
}

export function getMissingCaseWizardFields({
  title,
  coverUrl,
  owner,
  data,
}: {
  title: string
  coverUrl: string
  owner: string
  data: CaseWizardData
}) {
  return [
    ["заголовок", title],
    ["описание проекта", plainText(data.projectAbout)],
    ["категория или услуга", data.serviceNames[0]],
    ["срок реализации", data.duration],
    ["бюджет", data.budget],
    ["обложка", coverUrl],
    ["клиент", data.clientName],
    ["задача", plainText(data.task)],
    ["решение", plainText(data.solution)],
    ["результат", plainText(data.result)],
    ["владелец материала", owner],
  ]
    .filter(([, value]) => !value)
    .map(([label]) => label)
}
