import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getClientTenders } from "@/lib/supabase/queries"
import { formatDate, formatMoney } from "@/lib/utils"
import type { Tender } from "@/types"

export default async function ClientTendersPage() {
  const { user, organizations, tenders } = await getClientTenders()

  if (!user) redirect("/login")
  if (organizations.length === 0) redirect("/onboarding")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="type-h1">Мои задачи</h1>
          <p className="type-body mt-2 text-muted-foreground">
            Задачи всех организаций, к которым у вас есть доступ.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/client/tenders/new">Создать задачу</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {(tenders as Tender[]).map((tender) => (
          <Card key={tender.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{tender.title}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tender.description ?? "Описание не заполнено."}
                  </p>
                </div>
                <Badge>{tender.status ?? "draft"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {formatMoney(tender.budget_from ?? tender.budget)} · дедлайн{" "}
                {formatDate(tender.deadline)}
              </div>
              <div className="flex flex-wrap gap-2">
                {tender.status === "published" ? (
                  <Button asChild variant="outline">
                    <Link href={`/tenders/${tender.slug}`}>Открыть</Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link
                    href={`/dashboard/client/tenders/${tender.id}/responses`}
                  >
                    Отклики
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/dashboard/client/tenders/${tender.id}/edit`}>
                    Редактировать
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {tenders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Задач пока нет.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
