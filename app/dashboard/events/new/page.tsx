import { EventForm } from "@/components/events/event-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getCurrentExpertProfile, getUserOrganizationMemberships } from "@/lib/supabase/queries"

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const { user, profile } = await getCurrentExpertProfile()
  const memberships = user ? await getUserOrganizationMemberships(user.id) : []
  const canCreate =
    Boolean(profile) ||
    memberships.some((membership) =>
      ["owner", "admin", "editor"].includes(membership.role ?? "member"),
    )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Новое событие</h1>
        <p className="mt-2 text-muted-foreground">
          Создайте черновик или отправьте событие на модерацию.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      {canCreate ? (
        <EventForm expert={profile} memberships={memberships} mode="create" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Нужен экспертный профиль или организация</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Создавать мероприятия могут эксперты и участники организаций с ролью owner,
            admin или editor.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
