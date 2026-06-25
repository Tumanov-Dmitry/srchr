import Link from "next/link"
import { ClearMaterialAutosave } from "@/components/media/clear-material-autosave"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getDashboardMaterials } from "@/lib/supabase/queries"

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликован",
  rejected: "Отклонен",
  archived: "Архив",
}

const typeLabels: Record<string, string> = {
  case: "Кейс",
  article: "Статья",
}

export default async function DashboardMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ draftKey?: string; message?: string }>
}) {
  const { draftKey, message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const { materials, isMaterialsTableMissing } = await getDashboardMaterials()
  const statusCounts = materials.reduce<Record<string, number>>(
    (acc, material) => {
      const status = material.status ?? "unknown"
      acc[status] = (acc[status] ?? 0) + 1
      return acc
    },
    {},
  )

  return (
    <div className="space-y-6">
      {message && draftKey ? (
        <ClearMaterialAutosave storageKey={draftKey} />
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="type-h1">Медиа</h1>
          <p className="type-body mt-2 text-muted-foreground">
            Публикации, материалы и кейсы организации.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/media/new">Добавить материал</Link>
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      {isMaterialsTableMissing ? (
        <Card>
          <CardHeader>
            <CardTitle>Нужна таблица materials</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Чтобы сохранять черновики, статьи и материалы на модерации,
            примените SQL из supabase/sql/create-materials.sql.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Материалы</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <Badge key={status} variant="outline">
                  {statusLabels[status] ?? status}: {count}
                </Badge>
              ))}
            </div>
          ) : null}

          {materials.length > 0 ? (
            <div className="divide-y">
              {materials.map((material) => (
                <div
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                  key={material.id}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {typeLabels[material.type] ?? material.type}
                      </Badge>
                      <Badge>
                        {statusLabels[material.status ?? ""] ??
                          material.status ??
                          "Без статуса"}
                      </Badge>
                      {material.category ? (
                        <span className="text-xs text-muted-foreground">
                          {material.category}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <h2 className="font-medium">{material.title}</h2>
                      {material.description ? (
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                          {material.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <div className="text-sm text-muted-foreground">
                      {material.updated_at || material.created_at
                        ? new Date(
                            material.updated_at ?? material.created_at ?? "",
                          ).toLocaleDateString("ru-RU")
                        : "Дата не указана"}
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/media/${material.id}/edit`}>
                        Редактировать
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Материалов пока нет. Создайте кейс или статью, сохраните черновик
              или отправьте материал на модерацию.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
