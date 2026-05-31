import Link from "next/link"
import {
  BriefcaseBusiness,
  Building2,
  FolderKanban,
  Heart,
  Home,
  MessageSquareReply,
  Settings,
} from "lucide-react"

const items = [
  { href: "/dashboard", label: "Обзор", icon: Home },
  { href: "/dashboard/contractor", label: "Кабинет подрядчика", icon: BriefcaseBusiness },
  { href: "/dashboard/client", label: "Кабинет заказчика", icon: Building2 },
  { href: "/dashboard/organization", label: "Организация", icon: Building2 },
  { href: "/dashboard/client/tenders", label: "Мои задачи", icon: BriefcaseBusiness },
  { href: "/dashboard/contractor/responses", label: "Мои отклики", icon: MessageSquareReply },
  { href: "/dashboard/cases", label: "Мои кейсы", icon: FolderKanban },
  { href: "/dashboard/favorites", label: "Избранное", icon: Heart },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
]

export function DashboardNav() {
  return (
    <nav className="grid gap-1">
      {items.map((item) => {
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
