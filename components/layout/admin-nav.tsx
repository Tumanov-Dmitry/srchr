"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Bell,
  CircleAlert,
  FileText,
  FolderKanban,
  Home,
  Newspaper,
  Sparkles,
  UserRound,
  Users,
} from "@/components/ui/icons"
import { cn } from "@/lib/utils"

const items = [
  { href: "/admin", label: "Дашборд", icon: Home },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/experts", label: "Эксперты", icon: UserRound },
  { href: "/admin/organizations", label: "Компании", icon: Building2 },
  { href: "/admin/materials", label: "Материалы", icon: FolderKanban },
  { href: "/admin/cases", label: "Кейсы", icon: FileText },
  { href: "/admin/articles", label: "Статьи", icon: Newspaper },
  { href: "/admin/tenders", label: "Задачи", icon: BriefcaseBusiness },
  { href: "/admin/events", label: "Мероприятия", icon: CalendarDays },
  { href: "/admin/notifications", label: "Уведомления", icon: Bell },
  {
    href: "/admin/system-events",
    label: "Системные события",
    icon: CircleAlert,
  },
  { href: "/admin/analytics", label: "Аналитика", icon: BarChart3 },
  {
    href: "/admin/onboarding-stories",
    label: "Сторис онбординга",
    icon: Sparkles,
  },
  { href: "/admin/knowledge", label: "База знаний", icon: BookOpenText },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const Icon = item.icon
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/75 hover:text-foreground",
              active &&
                "bg-foreground text-background hover:bg-foreground/90 hover:text-background",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
