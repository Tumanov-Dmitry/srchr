import Link from "next/link"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getContractorResponses } from "@/lib/supabase/queries"
import { formatDate } from "@/lib/utils"

export default async function ContractorResponsesPage() {
  const { user, organization, responses } = await getContractorResponses()

  if (!user) redirect("/login")
  if (!organization) redirect("/onboarding")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Мои отклики</h1>
        <p className="mt-2 text-muted-foreground">
          Отклики организации {organization.name}.
        </p>
      </div>
      <div className="grid gap-4">
        {responses.map((response) => (
          <Card key={response.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {response.tenders?.title ?? "Задача"}
                  </CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {response.tenders?.organizations?.name ?? "Компания не указана"}
                  </p>
                </div>
                <Badge>{response.status ?? "sent"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Дата отклика: {formatDate(response.created_at)}
              </div>
              {response.tenders?.slug ? (
                <Button asChild variant="outline">
                  <Link href={`/tenders/${response.tenders.slug}`}>Открыть задачу</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
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
