import Link from "next/link"
import { Search } from "lucide-react"
import { logout } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { getAdminAccess } from "@/lib/supabase/admin-queries"
import { getCurrentUser } from "@/lib/supabase/queries"

const navItems = [
  { href: "/contractors", label: "Подрядчики" },
  { href: "/experts", label: "Эксперты" },
  { href: "/media", label: "Медиа" },
  { href: "/events", label: "Мероприятия" },
  { href: "/tenders", label: "Задачи" },
  { href: "/favorites", label: "Избранное" },
]

export async function SiteHeader() {
  const user = await getCurrentUser()
  const adminAccess = user ? await getAdminAccess() : null

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <Search className="h-5 w-5 text-primary" />
              SRCHR
            </Link>
            {adminAccess?.isAdmin ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/admin">Админ</Link>
              </Button>
            ) : null}
          </div>
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost">
                <Link href="/dashboard">ЛК</Link>
              </Button>
              <form action={logout}>
                <Button variant="outline" type="submit">
                  Выйти
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Регистрация</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
