import Link from "next/link"

import { updateAdminMaterialStatus } from "@/app/actions/admin"
import { AdminStatusForm } from "@/components/admin/status-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Material } from "@/types"

const statuses = ["draft", "moderation", "published", "rejected", "archived"]
const statusLabels: Record<string, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликован",
  rejected: "Требует доработки",
  archived: "Архив",
}
const statusOptions = statuses.map((status) => ({
  value: status,
  label: statusLabels[status],
}))

export function AdminMaterialsTable({ materials }: { materials: Material[] }) {
  return (
    <Table className="min-w-[980px]">
      <TableHeader>
        <TableRow>
          <TableHead>Материал</TableHead>
          <TableHead>Тип</TableHead>
          <TableHead>Автор</TableHead>
          <TableHead>Рубрика</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Создан</TableHead>
          <TableHead>Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {materials.map((material) => (
          <TableRow key={material.id}>
            <TableCell>
              <div className="font-medium">{material.title}</div>
              <div className="max-w-md truncate text-xs text-muted-foreground">
                {material.description ?? material.slug}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {material.type === "case" ? "Кейс" : "Статья"}
              </Badge>
            </TableCell>
            <TableCell>{material.author ?? "—"}</TableCell>
            <TableCell>{material.category ?? "—"}</TableCell>
            <TableCell>
              <Badge>
                {statusLabels[material.status ?? ""] ?? material.status ?? "—"}
              </Badge>
            </TableCell>
            <TableCell>
              {material.created_at
                ? new Date(material.created_at).toLocaleDateString("ru-RU")
                : "—"}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/media/${material.id}/edit`}>
                    Открыть
                  </Link>
                </Button>
                <AdminStatusForm
                  action={updateAdminMaterialStatus}
                  defaultValue={material.status ?? "draft"}
                  hidden={{ type: material.type }}
                  id={material.id}
                  options={statusOptions}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
