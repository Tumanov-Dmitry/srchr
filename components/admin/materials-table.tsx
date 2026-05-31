import Link from "next/link"
import { updateAdminMaterialStatus } from "@/app/actions/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Material } from "@/types"

const statuses = ["draft", "moderation", "published", "rejected", "archived"]

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликован",
  rejected: "Требует доработки",
  archived: "Архив",
}

export function AdminMaterialsTable({ materials }: { materials: Material[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-sm">
        <thead className="text-left text-muted-foreground">
          <tr className="border-b">
            <th className="py-3 pr-4">Материал</th>
            <th className="py-3 pr-4">Тип</th>
            <th className="py-3 pr-4">Автор</th>
            <th className="py-3 pr-4">Рубрика</th>
            <th className="py-3 pr-4">Статус</th>
            <th className="py-3 pr-4">Создан</th>
            <th className="py-3 pr-4">Действия</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((material) => (
            <tr className="border-b last:border-0" key={material.id}>
              <td className="py-3 pr-4">
                <div className="font-medium">{material.title}</div>
                <div className="max-w-md truncate text-xs text-muted-foreground">
                  {material.description ?? material.slug}
                </div>
              </td>
              <td className="py-3 pr-4">
                <Badge variant="outline">
                  {material.type === "case" ? "Кейс" : "Статья"}
                </Badge>
              </td>
              <td className="py-3 pr-4">{material.author ?? "—"}</td>
              <td className="py-3 pr-4">{material.category ?? "—"}</td>
              <td className="py-3 pr-4">
                <Badge>{statusLabels[material.status ?? ""] ?? material.status ?? "—"}</Badge>
              </td>
              <td className="py-3 pr-4">
                {material.created_at
                  ? new Date(material.created_at).toLocaleDateString("ru-RU")
                  : "—"}
              </td>
              <td className="py-3 pr-4">
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/media/${material.id}/edit`}>Открыть</Link>
                  </Button>
                  <form action={updateAdminMaterialStatus} className="flex gap-2">
                    <input name="id" type="hidden" value={material.id} />
                    <input name="type" type="hidden" value={material.type} />
                    <select
                      className="h-9 rounded-md border border-input bg-background px-2"
                      defaultValue={material.status ?? "draft"}
                      name="status"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" type="submit">
                      Сохранить
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
