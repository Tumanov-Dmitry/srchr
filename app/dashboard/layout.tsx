import Link from "next/link"
import { redirect } from "next/navigation"
import { Search } from "lucide-react"
import { logout } from "@/app/actions/auth"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { Button } from "@/components/ui/button"
import { getAdminAccess } from "@/lib/supabase/admin-queries"
import { getOnboardingState } from "@/lib/supabase/queries"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const state = await getOnboardingState()

  if (!state.user) {
    redirect("/login")
  }

  if (!state.isComplete) {
    redirect("/onboarding")
  }

  const adminAccess = await getAdminAccess()

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <Search className="h-5 w-5 text-primary" />
              SRCHR
            </Link>
            {adminAccess.isAdmin ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/admin">Админ</Link>
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/contractors">Каталог</Link>
            </Button>
            <form action={logout}>
              <Button variant="outline" type="submit">
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border bg-background p-3">
          <DashboardNav primaryRole={state.primaryRole} />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  )
}
