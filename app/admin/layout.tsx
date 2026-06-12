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
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
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
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:hidden">
        <AdminMobileNav />
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="hidden h-fit rounded-lg border bg-background p-3 lg:block">
          <AdminNav />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  )
}
