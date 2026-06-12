import { redirect } from "next/navigation"
import { OnboardingForm } from "@/components/onboarding/onboarding-form"
import { getOnboardingState } from "@/lib/supabase/queries"

export default async function DashboardOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const [{ message }, state] = await Promise.all([
    searchParams,
    getOnboardingState(),
  ])

  if (!state.user) redirect("/login")
  if (state.isComplete) redirect(state.dashboardPath)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">
          Создайте экспертный профиль
        </h1>
        <p className="mt-2 text-muted-foreground">
          Это основа вашего аккаунта. Организацию можно подключить сейчас или
          позже.
        </p>
      </div>
      <OnboardingForm message={message} />
    </div>
  )
}
