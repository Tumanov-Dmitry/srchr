import Link from "next/link"
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Bell,
  CircleAlert,
  FileText,
  FolderKanban,
  Home,
  Newspaper,
  UserRound,
  Users,
} from "lucide-react"

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
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/system-events", label: "System Events", icon: CircleAlert },
  { href: "/admin/analytics", label: "Аналитика", icon: BarChart3 },
]

export function AdminNav() {
  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const Icon = item.icon

        return (
          <Link
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
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
