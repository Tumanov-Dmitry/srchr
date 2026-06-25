import Link from "next/link"
import { WalletCards } from "@/components/ui/icons"
import { PageShell } from "@/components/layout/page-shell"
import { PriceRequestCard } from "@/components/price-requests/price-request-card"
import { EmptyState } from "@/components/srchr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getActivePriceRequests } from "@/lib/supabase/price-request-queries"

export default async function PriceRequestsPage() {
  const { user, requests, isMissing } = await getActivePriceRequests()

  return (
    <PageShell>
      <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="type-h1">Запросы стоимости</h1>
          <p className="type-body mt-3 text-muted-foreground">
            Получите несколько независимых оценок бюджета и сроков до создания
            полноценного задания.
          </p>
        </div>
        <Button asChild>
          <Link
            href={user ? "/price-requests/new" : "/login?next=/price-requests/new"}
          >
            Создать запрос
          </Link>
        </Button>
      </div>

      {isMissing ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Нужны таблицы модуля запросов стоимости</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Примените SQL из <code>supabase/sql/create-price-requests.sql</code>
            .
          </CardContent>
        </Card>
      ) : requests.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <PriceRequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            description="Активных запросов пока нет. Можно создать первый и собрать ориентиры рынка."
            icon={WalletCards}
            title="Запросов пока нет"
          />
        </div>
      )}
    </PageShell>
  )
}
