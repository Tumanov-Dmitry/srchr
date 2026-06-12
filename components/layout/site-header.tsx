import Link from "next/link"
import { ArrowUpRight, Search } from "@/components/ui/icons"

import { logout } from "@/app/actions/auth"
import { SiteMobileNav } from "@/components/layout/site-mobile-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAdminAccess } from "@/lib/supabase/admin-queries"
import { getCurrentUser } from "@/lib/supabase/queries"

const navItems = [
  { href: "/contractors", label: "Подрядчики" },
  { href: "/experts", label: "Эксперты" },
  { href: "/media", label: "Медиа" },
  { href: "/events", label: "Мероприятия" },
  { href: "/tenders", label: "Задачи" },
  { href: "/price-requests", label: "Стоимость" },
  { href: "/insights", label: "Аналитика" },
]

export async function SiteHeader() {
  const user = await getCurrentUser()
  const adminAccess = user ? await getAdminAccess() : null

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <div className="flex shrink-0 items-center gap-3">
            <Link
              className="flex items-center gap-2 text-xl font-bold"
              href="/"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Search className="size-4" />
              </span>
              SRCHR
            </Link>
            <Badge
              className="hidden border-border bg-secondary text-secondary-foreground hover:bg-foreground/[0.055] sm:inline-flex"
              variant="outline"
            >
              beta
            </Badge>
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Button asChild key={item.href} size="sm" variant="ghost">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SiteMobileNav
            items={[
              ...navItems,
              ...(user
                ? [
                    { href: "/dashboard", label: "Личный кабинет" },
                    { href: "/dashboard/favorites", label: "Избранное" },
                  ]
                : [
                    { href: "/login", label: "Войти" },
                    { href: "/signup", label: "Регистрация" },
                  ]),
            ]}
          />
          {adminAccess?.isAdmin ? (
            <Button
              asChild
              className="hidden sm:inline-flex"
              size="sm"
              variant="outline"
            >
              <Link href="/admin">Админ</Link>
            </Button>
          ) : null}
          {user ? (
            <>
              <NotificationBell />
              <Button asChild className="hidden sm:inline-flex" size="sm">
                <Link href="/dashboard">
                  Кабинет
                  <ArrowUpRight />
                </Link>
              </Button>
              <form action={logout} className="hidden sm:block">
                <Button size="sm" type="submit" variant="ghost">
                  Выйти
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button
                asChild
                className="hidden sm:inline-flex"
                size="sm"
                variant="ghost"
              >
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex" size="sm">
                <Link href="/signup">Регистрация</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
