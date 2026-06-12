"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Award,
  BarChart3,
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
  WalletCards,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"

const items: Array<{
  href: string
  label: string
  icon: typeof Home
  visibleFor?: string[]
}> = [
  { href: "/dashboard", label: "Обзор", icon: Home },
  {
    href: "/dashboard/contractor",
    label: "Профиль подрядчика",
    icon: BriefcaseBusiness,
    visibleFor: ["contractor"],
  },
  {
    href: "/dashboard/client",
    label: "Кабинет заказчика",
    icon: Building2,
    visibleFor: ["client"],
  },
  { href: "/dashboard/organization", label: "Организации", icon: Building2 },
  { href: "/dashboard/expert", label: "Профиль эксперта", icon: UserRound },
  { href: "/dashboard/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/dashboard/reputation", label: "Репутация", icon: Award },
  {
    href: "/dashboard/client/tenders",
    label: "Мои задачи",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dashboard/responses",
    label: "Мои отклики",
    icon: MessageSquareReply,
  },
  { href: "/dashboard/media", label: "Медиа", icon: FolderKanban },
  { href: "/dashboard/events", label: "Мероприятия", icon: CalendarDays },
  {
    href: "/dashboard/price-requests",
    label: "Запросы стоимости",
    icon: WalletCards,
  },
  { href: "/dashboard/notifications", label: "Уведомления", icon: Bell },
  { href: "/dashboard/favorites", label: "Избранное", icon: Heart },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
]

export function DashboardNav({ primaryRole }: { primaryRole?: string | null }) {
  const pathname = usePathname()
  const visibleItems = items.filter(
    (item) =>
      !item.visibleFor ||
      (primaryRole ? item.visibleFor.includes(primaryRole) : false),
  )

  return (
    <nav className="grid gap-1">
      {visibleItems.map((item) => {
        const Icon = item.icon
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active &&
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
