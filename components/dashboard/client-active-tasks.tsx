import Link from "next/link"
import { BriefcaseBusiness, Plus } from "@/components/ui/icons"

import type { DashboardTender } from "@/components/dashboard/dashboard-types"
import { EmptyState } from "@/components/srchr/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

type ClientActiveTasksProps = {
  tenders: DashboardTender[]
}

export function ClientActiveTasks({ tenders }: ClientActiveTasksProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="type-h2">Активные задачи</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Статусы задач и новые отклики исполнителей.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/client/tenders/new">
            <Plus />
            Создать
          </Link>
        </Button>
      </div>
      {tenders.length > 0 ? (
        <div className="divide-y border-y">
          {tenders.slice(0, 5).map((tender) => (
            <article
              className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              key={tender.id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{tender.title}</h3>
                  <Badge variant="secondary">{tender.status ?? "draft"}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tender.responsesCount ?? 0} откликов
                  {tender.deadline
                    ? ` · дедлайн ${formatDate(tender.deadline)}`
                    : ""}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/client/tenders/${tender.id}/responses`}>
                  Открыть
                </Link>
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          description="Создайте первое задание, чтобы получить отклики от агентств и экспертов."
          icon={BriefcaseBusiness}
          title="У вас пока нет задач"
        />
      )}
    </section>
  )
}
