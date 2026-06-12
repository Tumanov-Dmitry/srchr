import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TenderSlugFields } from "@/components/tenders/tender-slug-fields"
import type { Organization, Tender } from "@/types"

export function TenderForm({
  action,
  tender,
  message,
  organizations,
}: {
  action: (formData: FormData) => void | Promise<void>
  tender?: Tender | null
  message?: string
  organizations: Organization[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {tender ? "Редактирование задачи" : "Новая задача"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5 md:grid-cols-2">
          <TenderSlugFields
            defaultTitle={tender?.title}
            defaultSlug={tender?.slug}
          />
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="organization_id">Организация-владелец</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={
                tender?.organization_id ?? organizations[0]?.id ?? ""
              }
              id="organization_id"
              name="organization_id"
              required
            >
              <option value="">Выберите организацию</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={tender?.description ?? ""}
              className="min-h-32"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="goal">Цель</Label>
            <Textarea id="goal" name="goal" defaultValue={tender?.goal ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_from">Бюджет от</Label>
            <Input
              id="budget_from"
              name="budget_from"
              type="number"
              min="0"
              step="1000"
              defaultValue={tender?.budget_from ?? tender?.budget ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_to">Бюджет до</Label>
            <Input
              id="budget_to"
              name="budget_to"
              type="number"
              min="0"
              step="1000"
              defaultValue={tender?.budget_to ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Дедлайн</Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={tender?.deadline?.slice(0, 10) ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <select
              id="status"
              name="status"
              defaultValue={tender?.status ?? "draft"}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="draft">Черновик</option>
              <option value="published">Опубликована</option>
              {tender ? (
                <>
                  <option value="closed">Закрыта</option>
                  <option value="archived">В архиве</option>
                </>
              ) : null}
            </select>
          </div>

          {message ? (
            <p className="text-sm text-destructive md:col-span-2">{message}</p>
          ) : null}

          <div className="flex gap-3 md:col-span-2">
            <Button type="submit">Сохранить</Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/client/tenders">Отмена</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
