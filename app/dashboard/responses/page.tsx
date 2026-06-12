import Link from "next/link"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserTenderResponses } from "@/lib/supabase/queries"
import { formatDate } from "@/lib/utils"

export default async function ResponsesPage() {
  const { user, responses } = await getUserTenderResponses()

  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Мои отклики</h1>
        <p className="mt-2 text-muted-foreground">
          Отклики, отправленные от имени эксперта или ваших организаций.
        </p>
      </div>

      <div className="grid gap-4">
        {responses.map((response) => {
          const isExpert = response.responder_type === "expert"
          const responderName = isExpert
            ? [
                response.expert_profiles?.first_name,
                response.expert_profiles?.last_name,
              ]
                .filter(Boolean)
                .join(" ") || "Эксперт"
            : (response.organizations?.name ?? "Организация")

          return (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {response.tenders?.title ?? "Задача"}
                    </CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">
                      От имени: {responderName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {isExpert ? "Эксперт" : "Подрядчик"}
                    </Badge>
                    <Badge>{response.status ?? "sent"}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Дата отклика: {formatDate(response.created_at)}
                </div>
                {response.tenders?.slug ? (
                  <Button asChild variant="outline">
                    <Link href={`/tenders/${response.tenders.slug}`}>
                      Открыть задачу
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
        {responses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Откликов пока нет.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
