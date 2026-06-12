import { notFound, redirect } from "next/navigation"
import {
  convertPriceRequestToTender,
  updatePriceRequestStatus,
} from "@/app/actions/price-requests"
import { PriceRequestForm } from "@/components/price-requests/price-request-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getPriceRequestEditor } from "@/lib/supabase/price-request-queries"
import { getUserOrganizationMemberships } from "@/lib/supabase/queries"

export default async function ManagePriceRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const { id } = await params
  const result = await getPriceRequestEditor(id)
  if (!result.user) redirect(`/login?next=/price-requests/${id}/manage`)
  if (!result.request) notFound()

  const memberships = await getUserOrganizationMemberships(result.user.id)
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="type-h1">Управление запросом</h1>
        <p className="mt-3 text-muted-foreground">
          Редактируйте черновик, завершите сбор оценок или создайте обычное
          задание.
        </p>
      </div>
      {message ? (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
          {message}
        </div>
      ) : null}

      {["draft", "active"].includes(result.request.status) ? (
        <PriceRequestForm memberships={memberships} request={result.request} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Запрос закрыт</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Текущий статус: {result.request.status}
          </CardContent>
        </Card>
      )}

      {result.request.status === "active" ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Завершение сбора оценок</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <form action={convertPriceRequestToTender}>
              <input name="id" type="hidden" value={result.request.id} />
              <Button type="submit">Создать черновик задания</Button>
            </form>
            <form action={updatePriceRequestStatus}>
              <input name="id" type="hidden" value={result.request.id} />
              <Button
                name="status"
                type="submit"
                value="completed"
                variant="outline"
              >
                Завершить
              </Button>
            </form>
            <form action={updatePriceRequestStatus}>
              <input name="id" type="hidden" value={result.request.id} />
              <Button
                name="status"
                type="submit"
                value="cancelled"
                variant="destructive"
              >
                Отменить
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}
