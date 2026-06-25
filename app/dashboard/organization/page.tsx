import { reviewOrganizationJoinRequest } from "@/app/actions/organization-requests"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getCurrentUser,
  getUserOrganizationMemberships,
} from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/server"

export default async function OrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const [{ message }, user] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ])
  if (!user) return null

  const memberships = await getUserOrganizationMemberships(user.id)
  const managedOrganizationIds = memberships
    .filter((membership) => ["owner", "admin"].includes(membership.role ?? ""))
    .map(
      (membership) =>
        membership.organization_id ??
        membership.org_id ??
        membership.organizations?.id,
    )
    .filter((id): id is string => Boolean(id))

  const supabase = await createClient()
  const { data: requests } =
    managedOrganizationIds.length > 0
      ? await supabase
          .from("organization_join_requests")
          .select("*, organizations(name)")
          .in("organization_id", managedOrganizationIds)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      : { data: [] }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Организации</h1>
        <p className="mt-2 text-muted-foreground">
          Связанные компании, заполненность карточек и запросы участников.
        </p>
      </div>

      {message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Запросы на присоединение</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(requests ?? []).length > 0 ? (
            (requests ?? []).map((request) => (
              <div
                className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
                key={request.id}
              >
                <div>
                  <p className="font-medium">
                    Новый участник для{" "}
                    {request.organizations?.name ?? "организации"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Роль: {request.requested_role}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={reviewOrganizationJoinRequest}>
                    <input name="request_id" type="hidden" value={request.id} />
                    <Button
                      name="decision"
                      size="sm"
                      type="submit"
                      value="approved"
                    >
                      Одобрить
                    </Button>
                  </form>
                  <form action={reviewOrganizationJoinRequest}>
                    <input name="request_id" type="hidden" value={request.id} />
                    <Button
                      name="decision"
                      size="sm"
                      type="submit"
                      value="rejected"
                      variant="outline"
                    >
                      Отклонить
                    </Button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Новых запросов нет.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
