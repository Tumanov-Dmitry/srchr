import { redirect } from "next/navigation"
import { createTender } from "@/app/actions/tenders"
import { TenderForm } from "@/components/tenders/tender-form"
import { getCurrentTenderOwnerOrganization } from "@/lib/supabase/queries"

export default async function NewTenderPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const [{ message }, { user, organization }] = await Promise.all([
    searchParams,
    getCurrentTenderOwnerOrganization(),
  ])

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Создать задачу</h1>
        <p className="mt-2 text-muted-foreground">
          Задача будет создана от имени организации {organization.name}.
        </p>
      </div>
      <TenderForm action={createTender} message={message} />
    </div>
  )
}
