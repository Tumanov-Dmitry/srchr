import { notFound } from "next/navigation"
import { EventForm } from "@/components/events/event-form"
import { decodeMessage } from "@/lib/messages"
import { getAdminEventById } from "@/lib/supabase/admin-queries"

export default async function AdminEditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const { id } = await params
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const event = await getAdminEventById(id)

  if (!event) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Редактирование события</h1>
        <p className="mt-2 text-muted-foreground">
          Админское редактирование без смены владельца события.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <EventForm admin event={event} memberships={[]} mode="edit" />
    </div>
  )
}
