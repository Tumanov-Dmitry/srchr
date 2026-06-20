import Link from "next/link"
import { Building2, UserRound } from "@/components/ui/icons"

import type { PresenceItem } from "@/components/dashboard/dashboard-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SectionCard } from "@/components/srchr/section-card"

type ContractorPresenceProps = {
  items: PresenceItem[]
}

export function ContractorPresence({ items }: ContractorPresenceProps) {
  if (items.length === 0) return null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="type-h2">Ваше присутствие в Сёрчере</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Публичные профили, которые формируют доверие к вам и вашей команде.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.kind === "organization" ? Building2 : UserRound
          return (
            <SectionCard className="h-full" key={`${item.kind}:${item.title}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </span>
                <Badge
                  variant={
                    item.status === "published" ? "default" : "secondary"
                  }
                >
                  {item.status === "published" ? "Опубликован" : "Черновик"}
                </Badge>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Заполнено</span>
                <span className="font-medium">{item.score.percent}%</span>
              </div>
              <Progress className="mt-2" value={item.score.percent} />
              {item.score.missing.length > 0 ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Добавьте: {item.score.missing.slice(0, 3).join(", ")}.
                </p>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Основные разделы профиля заполнены.
                </p>
              )}
              <Button asChild className="mt-5" size="sm" variant="outline">
                <Link href={item.href}>Редактировать</Link>
              </Button>
            </SectionCard>
          )
        })}
      </div>
    </section>
  )
}
