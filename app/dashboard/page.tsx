import { ClientDashboard } from "@/components/dashboard/client-dashboard"
import { ContractorDashboard } from "@/components/dashboard/contractor-dashboard"
import type { PresenceItem } from "@/components/dashboard/dashboard-types"
import { UniversalDashboard } from "@/components/dashboard/universal-dashboard"
import { getUserNotifications } from "@/lib/supabase/notification-queries"
import { getTenderResponseCounts } from "@/lib/supabase/dashboard-queries"
import {
  getClientTenders,
  getCurrentContractorOrganization,
  getDashboardStoryHighlights,
  getDashboardMaterials,
  getDashboardReputation,
  getOnboardingState,
  getProfileCompletionState,
  getPublishedContractors,
  getPublishedExperts,
  getPublishedTenders,
  getUserFavorites,
} from "@/lib/supabase/queries"
import type { Material, Organization, Tender } from "@/types"

export default async function DashboardPage() {
  const state = await getOnboardingState()

  if (!state.user) return null

  const contractorMembership = state.memberships.find(
    (membership) => membership.organizations?.is_contractor,
  )
  const clientMembership = state.memberships.find(
    (membership) => membership.organizations?.is_client,
  )

  if (contractorMembership || (!clientMembership && state.expertProfile)) {
    const [
      completion,
      materialsState,
      tenders,
      reputationState,
      notificationsState,
      contractorState,
      storyHighlights,
    ] = await Promise.all([
      getProfileCompletionState(),
      getDashboardMaterials(),
      getPublishedTenders(),
      getDashboardReputation(),
      getUserNotifications(6),
      getCurrentContractorOrganization(),
      getDashboardStoryHighlights("contractor"),
    ])

    const organization = contractorMembership?.organizations ?? null
    const expert = state.expertProfile ?? null
    const organizationCompletion = completion.organizations.find(
      (item) => item.organization.id === organization?.id,
    )
    const presence: PresenceItem[] = []

    if (organization && organizationCompletion) {
      presence.push({
        kind: "organization" as const,
        title: organization.name,
        status: organization.status ?? "draft",
        score: organizationCompletion.score,
        href: "/dashboard/contractor/profile",
      })
    }

    if (expert && completion.expert?.score) {
      presence.push({
        kind: "expert" as const,
        title: [expert.first_name, expert.last_name].filter(Boolean).join(" "),
        status: expert.status ?? "draft",
        score: completion.expert.score,
        href: "/dashboard/expert",
      })
    }

    const serviceNames = contractorState.services
      .map((item) => item.services?.name?.toLocaleLowerCase("ru-RU"))
      .filter((name): name is string => Boolean(name))
    const publishedTenders = (tenders as Tender[]).filter((tender) => {
      if (serviceNames.length === 0) return true
      const searchable =
        `${tender.title} ${tender.description ?? ""} ${tender.goal ?? ""}`.toLocaleLowerCase(
          "ru-RU",
        )
      return serviceNames.some((service) => searchable.includes(service))
    })
    const reputationTarget = reputationState.targets.find((target) =>
      organization
        ? target.targetType === "contractor" &&
          target.targetId === organization.id
        : target.targetType === "expert" && target.targetId === expert?.id,
    )
    const dashboardName =
      organization?.name ||
      [expert?.first_name, expert?.last_name].filter(Boolean).join(" ") ||
      state.user.email ||
      "пользователь"

    return (
      <ContractorDashboard
        data={{
          name: dashboardName,
          presence,
          tenders: publishedTenders.slice(0, 6),
          materials: materialsState.materials as Material[],
          notifications: notificationsState.notifications,
          reputation: reputationTarget?.summary ?? null,
          storyHighlights,
        }}
      />
    )
  }

  if (clientMembership) {
    const [
      clientState,
      contractors,
      experts,
      favoritesState,
      notificationsState,
      storyHighlights,
    ] = await Promise.all([
      getClientTenders(),
      getPublishedContractors(),
      getPublishedExperts(),
      getUserFavorites(),
      getUserNotifications(6),
      getDashboardStoryHighlights("client"),
    ])
    const typedTenders = (clientState.tenders as Tender[]).filter(
      (tender) =>
        !["archived", "cancelled", "completed"].includes(
          tender.status ?? "draft",
        ),
    )
    const responseCounts = await getTenderResponseCounts(
      typedTenders.map((tender) => tender.id),
    )
    const organization = clientMembership.organizations ?? null
    const city = organization?.city?.toLocaleLowerCase("ru-RU")
    const recommendations = [
      ...(contractors as Organization[]).map((contractor) => ({
        id: contractor.id,
        type: "contractor" as const,
        name: contractor.name,
        description: contractor.description,
        city: contractor.city,
        imageUrl: contractor.logo_url,
        href: `/contractors/${contractor.slug}`,
        tags:
          contractor.organization_services
            ?.map((item) => item.services?.name)
            .filter((name): name is string => Boolean(name)) ?? [],
      })),
      ...experts.map((expert) => ({
        id: expert.id,
        type: "expert" as const,
        name: [expert.first_name, expert.last_name].filter(Boolean).join(" "),
        description: expert.short_description,
        city: expert.city,
        imageUrl: expert.avatar_url,
        href: `/experts/${expert.slug}`,
        tags: (expert.specializations ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      })),
    ].sort((left, right) => {
      if (!city) return left.name.localeCompare(right.name, "ru")
      const leftMatches = left.city?.toLocaleLowerCase("ru-RU") === city
      const rightMatches = right.city?.toLocaleLowerCase("ru-RU") === city
      return Number(rightMatches) - Number(leftMatches)
    })

    return (
      <ClientDashboard
        data={{
          name: organization?.name ?? state.user.email ?? "пользователь",
          organization,
          tenders: typedTenders.map((tender) => ({
            ...tender,
            responsesCount: responseCounts[tender.id] ?? 0,
          })),
          recommendations: recommendations.slice(0, 6),
          favorites: favoritesState.favorites,
          notifications: notificationsState.notifications,
          storyHighlights,
        }}
      />
    )
  }

  return <UniversalDashboard email={state.user.email} />
}
