import Link from "next/link"
import { redirect } from "next/navigation"
import { Search } from "@/components/ui/icons"
import { logout } from "@/app/actions/auth"
import { AdminNav } from "@/components/layout/admin-nav"
import { AdminMobileNav } from "@/components/layout/admin-mobile-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Button } from "@/components/ui/button"
import { getAdminAccess } from "@/lib/supabase/admin-queries"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const access = await getAdminAccess()

  if (!access.user) {
    redirect("/login")
  }

  if (!access.isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-18 max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2 text-lg font-semibold" href="/admin">
            <Search className="h-5 w-5 text-primary" />
            SRCHR Admin
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button asChild className="hidden md:inline-flex" variant="ghost">
              <Link href="/dev/ui">UI</Link>
            </Button>
            <Button asChild className="hidden md:inline-flex" variant="ghost">
              <Link href="/admin/knowledge">База знаний</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex" variant="ghost">
              <Link href="/dashboard">ЛК</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex" variant="ghost">
              <Link href="/">Сайт</Link>
            </Button>
            <form action={logout}>
              <Button type="submit" variant="outline">
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-4 pt-4 sm:px-6 lg:hidden">
        <AdminMobileNav />
      </div>
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8">
        <aside className="hidden h-fit rounded-xl border bg-card p-3 shadow-elevation-1 lg:sticky lg:top-24 lg:block">
          <AdminNav />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
