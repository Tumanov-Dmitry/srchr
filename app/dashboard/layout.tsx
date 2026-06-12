import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Search } from "@/components/ui/icons"

import { logout } from "@/app/actions/auth"
import { DashboardNav } from "@/components/layout/dashboard-nav"
import { DashboardMobileNav } from "@/components/layout/dashboard-mobile-nav"
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-18 max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              className="flex items-center gap-2 text-xl font-bold"
              href="/"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Search className="size-4" />
              </span>
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
            <Button asChild className="hidden sm:inline-flex" variant="ghost">
              <Link href="/contractors">
                <ArrowLeft />В каталог
              </Link>
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
        <DashboardMobileNav primaryRole={state.primaryRole} />
      </div>
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8">
        <aside className="hidden h-fit rounded-xl border bg-card p-3 shadow-elevation-1 lg:sticky lg:top-24 lg:block">
          <div className="mb-3 border-b px-3 pb-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Личный кабинет
            </p>
          </div>
          <DashboardNav primaryRole={state.primaryRole} />
        </aside>
        <main className="min-w-0">
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
