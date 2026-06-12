import { redirect } from "next/navigation"
import { createTender } from "@/app/actions/tenders"
import { TenderForm } from "@/components/tenders/tender-form"
import { getUserTenderOrganizations } from "@/lib/supabase/queries"

export default async function NewTenderPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const [{ message }, { user, organizations }] = await Promise.all([
    searchParams,
    getUserTenderOrganizations(),
  ])

  if (!user) redirect("/login")
  if (organizations.length === 0) redirect("/onboarding")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">
          Создать задачу
        </h1>
        <p className="mt-2 text-muted-foreground">
          Выберите организацию, от имени которой будет опубликована задача.
        </p>
      </div>
      <TenderForm
        action={createTender}
        message={message}
        organizations={organizations}
      />
    </div>
  )
}
