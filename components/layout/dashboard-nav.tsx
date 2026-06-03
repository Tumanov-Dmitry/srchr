import Link from "next/link"
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FolderKanban,
  Heart,
  Home,
  MessageSquareReply,
  Settings,
  UserRound,
} from "lucide-react"

const items = [
  { href: "/dashboard", label: "Обзор", icon: Home },
  {
    href: "/dashboard/contractor",
    label: "Кабинет подрядчика",
    icon: BriefcaseBusiness,
    hiddenFor: ["client"],
  },
  {
    href: "/dashboard/client",
    label: "Кабинет заказчика",
    icon: Building2,
    visibleFor: ["client"],
  },
  { href: "/dashboard/organization", label: "Организация", icon: Building2 },
  { href: "/dashboard/expert", label: "Профиль эксперта", icon: UserRound },
  {
    href: "/dashboard/client/tenders",
    label: "Мои задачи",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dashboard/contractor/responses",
    label: "Мои отклики",
    icon: MessageSquareReply,
  },
  { href: "/dashboard/media", label: "Медиа", icon: FolderKanban },
  { href: "/dashboard/events", label: "Мероприятия", icon: CalendarDays },
  { href: "/dashboard/notifications", label: "Уведомления", icon: Bell },
  { href: "/dashboard/favorites", label: "Избранное", icon: Heart },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
]

export function DashboardNav({
  primaryRole,
}: {
  primaryRole?: string | null
}) {
  const visibleItems = items.filter((item) => {
    if ("visibleFor" in item && item.visibleFor) {
      return primaryRole ? item.visibleFor.includes(primaryRole) : false
    }

    if ("hiddenFor" in item && item.hiddenFor) {
      return primaryRole ? !item.hiddenFor.includes(primaryRole) : true
    }

    return true
  })

  return (
    <nav className="grid gap-1">
      {visibleItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
