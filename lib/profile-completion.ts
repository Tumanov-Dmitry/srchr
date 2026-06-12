import type { CompletionScore, ExpertProfile, Organization } from "@/types"

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
}

function score(
  items: Array<{ complete: boolean; label: string }>,
): CompletionScore {
  const completed = items.filter((item) => item.complete).length
  return {
    completed,
    total: items.length,
    percent: Math.round((completed / items.length) * 100),
    missing: items.filter((item) => !item.complete).map((item) => item.label),
  }
}

export function calculateExpertCompletion(
  profile: ExpertProfile | null,
  counts: { cases: number; articles: number },
) {
  return score([
    { complete: hasText(profile?.avatar_url), label: "фото" },
    {
      complete: hasText(profile?.short_description),
      label: "описание",
    },
    { complete: hasText(profile?.position), label: "должность" },
    {
      complete: hasText(profile?.specializations),
      label: "специализации",
    },
    { complete: hasText(profile?.skills), label: "навыки" },
    {
      complete: Boolean(
        hasText(profile?.contact_email) || hasText(profile?.telegram_url),
      ),
      label: "контакты",
    },
    {
      complete: Boolean(
        hasText(profile?.website_url) ||
        hasText(profile?.linkedin_url) ||
        hasText(profile?.behance_url) ||
        hasText(profile?.dribbble_url),
      ),
      label: "ссылки",
    },
    { complete: counts.cases > 0, label: "кейс" },
    { complete: counts.articles > 0, label: "статья" },
  ])
}

export function calculateOrganizationCompletion(
  organization: Organization,
  counts: {
    services: number
    cases: number
    members: number
  },
) {
  return score([
    { complete: hasText(organization.logo_url), label: "логотип" },
    { complete: hasText(organization.description), label: "описание" },
    { complete: counts.services > 0, label: "услуги" },
    {
      complete: Boolean(
        hasText(organization.email) || hasText(organization.phone),
      ),
      label: "контакты",
    },
    {
      complete: Boolean(
        hasText(organization.website_url) || hasText(organization.website),
      ),
      label: "сайт",
    },
    { complete: counts.cases > 0, label: "кейс" },
    { complete: counts.members > 1, label: "сотрудники" },
  ])
}
