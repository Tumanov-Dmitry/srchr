import Link from "next/link"
import { Award, Bell, Sparkles } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/srchr/section-card"
import { formatDate } from "@/lib/utils"
import type { Notification, ReputationSummary } from "@/types"

type DashboardSidebarActivityProps = {
  notifications: Notification[]
  reputation?: ReputationSummary | null
  mode: "contractor" | "client"
}

export function DashboardSidebarActivity({
  notifications,
  reputation,
  mode,
}: DashboardSidebarActivityProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      {mode === "contractor" ? (
        <SectionCard title="Репутация">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Award className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold">
                {(reputation?.total_points ?? 0).toLocaleString("ru-RU")}
              </p>
              <p className="text-xs text-muted-foreground">баллов</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Публикуйте материалы, развивайте профиль и участвуйте в задачах,
            чтобы накапливать репутацию.
          </p>
          <Button asChild className="mt-4" size="sm" variant="outline">
            <Link href="/dashboard/reputation">Подробнее</Link>
          </Button>
        </SectionCard>
      ) : (
        <SectionCard title="Следующий шаг">
          <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </span>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Создайте задачу с понятным бюджетом и сроком — так отклики будут
            точнее.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/dashboard/client/tenders/new">Создать задачу</Link>
          </Button>
        </SectionCard>
      )}

      <SectionCard
        actions={
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/notifications">Все</Link>
          </Button>
        }
        title="Уведомления"
      >
        {notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.slice(0, 4).map((notification) => (
              <div className="py-3 first:pt-0 last:pb-0" key={notification.id}>
                <div className="flex gap-2">
                  <Bell className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-5">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            Здесь появятся важные изменения по задачам, материалам и профилям.
          </p>
        )}
      </SectionCard>
    </aside>
  )
}
