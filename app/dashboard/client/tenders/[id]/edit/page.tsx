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
  const { user, organizations, tender } = await getClientTenderById(id)

  if (!user) redirect("/login")
  if (organizations.length === 0) redirect("/onboarding")
  if (!tender) redirect("/dashboard/client/tenders")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="type-h1">
            Редактировать задачу
          </h1>
          <p className="type-body mt-2 text-muted-foreground">
            Изменения доступны только участникам организации-владельца задачи.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/analytics/tenders/${id}`}>Аналитика</Link>
        </Button>
      </div>
      <TenderForm
        action={updateTender.bind(null, id)}
        organizations={organizations}
        tender={tender as Tender}
        message={message}
      />
    </div>
  )
}
