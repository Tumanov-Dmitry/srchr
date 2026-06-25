import { redirect } from "next/navigation"
import { PageShell } from "@/components/layout/page-shell"
import { PriceRequestForm } from "@/components/price-requests/price-request-form"
import { decodeMessage } from "@/lib/messages"
import {
  getCurrentUser,
  getUserOrganizationMemberships,
} from "@/lib/supabase/queries"

export default async function NewPriceRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/price-requests/new")

  const memberships = await getUserOrganizationMemberships(user.id)
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)

  return (
    <PageShell className="max-w-4xl">
      <div className="mb-6 border-b pb-6">
        <h1 className="type-h1">Новый запрос стоимости</h1>
        <p className="type-body mt-3 text-muted-foreground">
          Опишите задачу без сложного тендерного брифа. Черновик можно
          опубликовать позже.
        </p>
      </div>
      {message ? (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          {message}
        </div>
      ) : null}
      <PriceRequestForm memberships={memberships} />
    </PageShell>
  )
}
