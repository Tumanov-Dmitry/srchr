import Link from "next/link"
import { BriefcaseBusiness, CalendarDays } from "@/components/ui/icons"

import { EmptyState } from "@/components/srchr/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatMoney } from "@/lib/utils"
import type { Tender } from "@/types"

type ContractorTasksProps = {
  tenders: Tender[]
}

export function ContractorTasks({ tenders }: ContractorTasksProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="type-h2">Новые задачи</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Свежие опубликованные запросы от заказчиков.
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/tenders">Все задачи</Link>
        </Button>
      </div>
      {tenders.length > 0 ? (
        <div className="divide-y border-y">
          {tenders.slice(0, 4).map((tender) => (
            <article
              className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              key={tender.id}
            >
              <div className="min-w-0">
                <h3 className="font-semibold">{tender.title}</h3>
                {tender.description ? (
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {tender.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {tender.budget || tender.budget_from || tender.budget_to ? (
                    <Badge variant="secondary">
                      {formatMoney(tender.budget_from ?? tender.budget)}
                    </Badge>
                  ) : null}
                  {tender.deadline ? (
                    <Badge variant="outline">
                      <CalendarDays className="mr-1 size-3.5" />
                      до {formatDate(tender.deadline)}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/tenders/${tender.slug}`}>Посмотреть</Link>
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          description="Пока нет подходящих задач. Заполните услуги и город, чтобы получать более точные рекомендации."
          icon={BriefcaseBusiness}
          title="Новых задач пока нет"
        />
      )}
    </section>
  )
}
