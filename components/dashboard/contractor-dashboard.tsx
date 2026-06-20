import {
  BarChart3,
  BriefcaseBusiness,
  FolderKanban,
  Pencil,
} from "@/components/ui/icons"

import { ContractorMaterials } from "@/components/dashboard/contractor-materials"
import { ContractorPresence } from "@/components/dashboard/contractor-presence"
import { ContractorTasks } from "@/components/dashboard/contractor-tasks"
import { DashboardHighlights } from "@/components/dashboard/dashboard-highlights"
import { DashboardSidebarActivity } from "@/components/dashboard/dashboard-sidebar-activity"
import type { ContractorDashboardData } from "@/components/dashboard/dashboard-types"
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome"
import { contractorStories } from "@/components/dashboard/stories-modal"

type ContractorDashboardProps = {
  data: ContractorDashboardData
}

export function ContractorDashboard({ data }: ContractorDashboardProps) {
  const organizationProfile = data.presence.find(
    (item) => item.kind === "organization",
  )

  return (
    <div className="space-y-8">
      <DashboardHighlights stories={contractorStories} />
      <DashboardWelcome
        actions={[
          {
            href: "/dashboard/media/new",
            label: "Добавить материал",
            icon: <FolderKanban />,
            primary: true,
          },
          {
            href: "/tenders",
            label: "Найти задачи",
            icon: <BriefcaseBusiness />,
          },
          {
            href: organizationProfile?.href ?? "/dashboard/expert",
            label: "Редактировать профиль",
            icon: <Pencil />,
          },
          {
            href: "/dashboard/analytics",
            label: "Аналитика",
            icon: <BarChart3 />,
          },
        ]}
        description="Управляйте профилем, материалами и новыми возможностями в Сёрчере."
        name={data.name}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          <ContractorPresence items={data.presence} />
          <ContractorTasks tenders={data.tenders} />
          <ContractorMaterials materials={data.materials} />
        </div>
        <DashboardSidebarActivity
          mode="contractor"
          notifications={data.notifications}
          reputation={data.reputation}
        />
      </div>
    </div>
  )
}
