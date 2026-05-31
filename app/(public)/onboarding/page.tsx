import { redirect } from "next/navigation"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { OnboardingForm } from "@/components/onboarding/onboarding-form"
import { getOnboardingState, getServices } from "@/lib/supabase/queries"
import type { Service } from "@/types"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const [{ message }, state, services] = await Promise.all([
    searchParams,
    getOnboardingState(),
    getServices(),
  ])

  if (!state.user) {
    redirect("/login")
  }

  if (state.isComplete) {
    redirect(state.dashboardPath)
  }

  return (
    <PageShell>
      <PageHeader
        title="Первичная настройка"
        description="Выберите роль и создайте организацию. Данные сохраняются в существующие таблицы Supabase."
      />
      <OnboardingForm services={services as Service[]} message={message} />
    </PageShell>
  )
}
