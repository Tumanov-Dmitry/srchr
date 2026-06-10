import Link from "next/link"
import { redirect } from "next/navigation"
import { updateTender } from "@/app/actions/tenders"
import { TenderForm } from "@/components/tenders/tender-form"
import { Button } from "@/components/ui/button"
import { getClientTenderById } from "@/lib/supabase/queries"
import type { Tender } from "@/types"

export default async function EditTenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const [{ id }, { message }] = await Promise.all([params, searchParams])
  const { user, organization, tender } = await getClientTenderById(id)

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")
  if (!tender) redirect("/dashboard/client/tenders")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">
            Редактировать задачу
          </h1>
          <p className="mt-2 text-muted-foreground">
            Изменения доступны только участникам организации-владельца задачи.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/analytics/tenders/${id}`}>Аналитика</Link>
        </Button>
      </div>
      <TenderForm
        action={updateTender.bind(null, id)}
        tender={tender as Tender}
        message={message}
      />
    </div>
  )
}
