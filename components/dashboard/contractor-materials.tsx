import Link from "next/link"
import { FileText, Plus } from "@/components/ui/icons"

import { EmptyState } from "@/components/srchr/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { Material } from "@/types"

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликован",
  rejected: "Отклонён",
  archived: "Архив",
}

type ContractorMaterialsProps = {
  materials: Material[]
}

export function ContractorMaterials({ materials }: ContractorMaterialsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="type-h2">Ваши материалы</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Последние кейсы и статьи со статусами публикации.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/media/new">
            <Plus />
            Добавить
          </Link>
        </Button>
      </div>
      {materials.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {materials.slice(0, 4).map((material) => (
            <Link
              className="rounded-lg border bg-card p-5 transition-colors hover:border-primary/40"
              href={`/dashboard/media/${material.id}/edit`}
              key={material.id}
            >
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline">
                  {material.type === "case" ? "Кейс" : "Статья"}
                </Badge>
                <Badge
                  variant={
                    material.status === "published" ? "default" : "secondary"
                  }
                >
                  {statusLabels[material.status ?? ""] ?? "Без статуса"}
                </Badge>
              </div>
              <h3 className="mt-5 line-clamp-2 font-semibold">
                {material.title}
              </h3>
              <p className="mt-4 text-xs text-muted-foreground">
                Обновлён{" "}
                {formatDate(material.updated_at ?? material.created_at)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          actionLabel={undefined}
          description="Создайте первый кейс или статью, чтобы показать опыт и подход к работе."
          icon={FileText}
          title="Материалов пока нет"
        />
      )}
    </section>
  )
}
