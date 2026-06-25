import {
  BriefcaseBusiness,
  Building2,
  Heart,
  MessageSquareReply,
} from "@/components/ui/icons"

import { ClientActiveTasks } from "@/components/dashboard/client-active-tasks"
import { ClientFavorites } from "@/components/dashboard/client-favorites"
import { ClientRecommendedContractors } from "@/components/dashboard/client-recommended-contractors"
import { DashboardHighlights } from "@/components/dashboard/dashboard-highlights"
import { DashboardSidebarActivity } from "@/components/dashboard/dashboard-sidebar-activity"
import type { ClientDashboardData } from "@/components/dashboard/dashboard-types"
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome"
import { clientStories } from "@/components/dashboard/stories-modal"

type ClientDashboardProps = {
  data: ClientDashboardData
}

export function ClientDashboard({ data }: ClientDashboardProps) {
  return (
    <div className="space-y-8">
      <DashboardHighlights
        stories={
          data.storyHighlights.length > 0 ? data.storyHighlights : clientStories
        }
      />
      <DashboardWelcome
        actions={[
          {
            href: "/contractors",
            label: "Найти подрядчика",
            icon: <Building2 />,
            primary: true,
          },
          {
            href: "/dashboard/client/tenders/new",
            label: "Создать задачу",
            icon: <BriefcaseBusiness />,
          },
          {
            href: "/dashboard/client/tenders",
            label: "Посмотреть отклики",
            icon: <MessageSquareReply />,
          },
          {
            href: "/dashboard/favorites",
            label: "Избранное",
            icon: <Heart />,
          },
        ]}
        description="Находите исполнителей, управляйте задачами и собирайте короткие списки."
        name={data.name}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          <ClientActiveTasks tenders={data.tenders} />
          <ClientRecommendedContractors
            recommendations={data.recommendations}
          />
          <ClientFavorites favorites={data.favorites} />
        </div>
        <DashboardSidebarActivity
          mode="client"
          notifications={data.notifications}
        />
      </div>
    </div>
  )
}
