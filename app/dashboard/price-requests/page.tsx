import Link from "next/link"
import { PriceRequestCard } from "@/components/price-requests/price-request-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getDashboardPriceRequests } from "@/lib/supabase/price-request-queries"

export default async function DashboardPriceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { requests, isMissing } = await getDashboardPriceRequests()
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Запросы стоимости</h1>
          <p className="mt-2 text-muted-foreground">
            Черновики, активные запросы и результаты предварительной оценки.
          </p>
        </div>
        <Button asChild>
          <Link href="/price-requests/new">Создать запрос</Link>
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
          {message}
        </div>
      ) : null}

      {isMissing ? (
        <Card>
          <CardHeader>
            <CardTitle>Модуль еще не подключен к базе</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Примените SQL из <code>supabase/sql/create-price-requests.sql</code>
            .
          </CardContent>
        </Card>
      ) : requests.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {requests.map((request) => (
            <PriceRequestCard key={request.id} manage request={request} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Запросов пока нет.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
