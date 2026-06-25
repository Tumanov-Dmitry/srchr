import Link from "next/link"
import { notFound } from "next/navigation"
import { EventForm } from "@/components/events/event-form"
import { Button } from "@/components/ui/button"
import { decodeMessage } from "@/lib/messages"
import {
  getCurrentExpertProfile,
  getDashboardEventById,
  getUserOrganizationMemberships,
} from "@/lib/supabase/queries"

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const { id } = await params
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const { event } = await getDashboardEventById(id)
  const { user, profile } = await getCurrentExpertProfile()
  const memberships = user ? await getUserOrganizationMemberships(user.id) : []

  if (!event) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="type-h1">Редактирование события</h1>
          <p className="type-body mt-2 text-muted-foreground">
            Публикация выполняется только через модерацию.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/analytics/events/${id}`}>Аналитика</Link>
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <EventForm event={event} expert={profile} memberships={memberships} mode="edit" />
    </div>
  )
}
