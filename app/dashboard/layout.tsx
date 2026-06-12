import Link from "next/link"
import { redirect } from "next/navigation"
import { Search } from "lucide-react"
import { logout } from "@/app/actions/auth"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { CompletionBanner } from "@/components/onboarding/completion-banner"
import { Button } from "@/components/ui/button"
import { getAdminAccess } from "@/lib/supabase/admin-queries"
import {
  getOnboardingState,
  getProfileCompletionState,
} from "@/lib/supabase/queries"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const state = await getOnboardingState()

  if (!state.user) {
    redirect("/login")
  }

  const [adminAccess, completion] = await Promise.all([
    getAdminAccess(),
    state.isComplete
      ? getProfileCompletionState()
      : Promise.resolve({ expert: null, organizations: [] }),
  ])

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold"
            >
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
            <NotificationBell />
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
        <main>
          {completion.expert?.score ? (
            <CompletionBanner
              href="/dashboard/expert"
              score={completion.expert.score}
              title="Завершите экспертный профиль"
            />
          ) : null}
          {completion.organizations
            .filter((item) => item.score.percent < 100)
            .slice(0, 1)
            .map((item) => (
              <CompletionBanner
                href="/dashboard/organization"
                key={item.organization.id}
                score={item.score}
                title={`Завершите оформление: ${item.organization.name}`}
              />
            ))}
          {children}
        </main>
      </div>
    </div>
  )
}
