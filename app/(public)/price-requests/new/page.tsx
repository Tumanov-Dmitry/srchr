import { redirect } from "next/navigation"
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
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="type-h1">Новый запрос стоимости</h1>
        <p className="mt-3 text-muted-foreground">
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
    </main>
  )
}
