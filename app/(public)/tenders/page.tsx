import Link from "next/link"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { TenderCard } from "@/components/tenders/tender-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPublishedTenders } from "@/lib/supabase/queries"
import type { Tender } from "@/types"

export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; budget?: string }>
}) {
  const filters = await searchParams
  const tenders = await getPublishedTenders(filters)

  return (
    <PageShell>
      <PageHeader
        title="Задачи"
        description="Публичные задачи от компаний, готовые к откликам подрядчиков."
      />
      <form className="mb-8 grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="q">Поиск</Label>
          <Input id="q" name="q" placeholder="Название задачи" defaultValue={filters.q} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Город</Label>
          <Input id="city" name="city" placeholder="Москва" defaultValue={filters.city} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Бюджет до</Label>
          <Input
            id="budget"
            name="budget"
            type="number"
            min="0"
            step="1000"
            placeholder="500000"
            defaultValue={filters.budget}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Услуга / категория</Label>
          <Input
            id="category"
            name="category"
            placeholder="Будет подключено"
            disabled
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">Применить</Button>
          <Button asChild variant="outline">
            <Link href="/tenders">Сбросить</Link>
          </Button>
        </div>
      </form>

      {tenders.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(tenders as Tender[]).map((tender) => (
            <TenderCard key={tender.id} tender={tender} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Опубликованные задачи не найдены.
        </div>
      )}
    </PageShell>
  )
}
