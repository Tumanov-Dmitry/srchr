import Link from "next/link"

import { TenderSlugFields } from "@/components/tenders/tender-slug-fields"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { FormSelect } from "@/components/ui/form-select"
import { Label } from "@/components/ui/label"
import { NumberInput } from "@/components/ui/number-input"
import { Textarea } from "@/components/ui/textarea"
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
            defaultSlug={tender?.slug}
            defaultTitle={tender?.title}
          />
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="organization_id">Организация-владелец</Label>
            <FormSelect
              defaultValue={
                tender?.organization_id ?? organizations[0]?.id ?? undefined
              }
              name="organization_id"
              options={organizations.map((organization) => ({
                value: organization.id,
                label: organization.name,
              }))}
              placeholder="Выберите организацию"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              className="min-h-32"
              defaultValue={tender?.description ?? ""}
              id="description"
              name="description"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="goal">Цель</Label>
            <Textarea defaultValue={tender?.goal ?? ""} id="goal" name="goal" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_from">Бюджет от</Label>
            <NumberInput
              defaultValue={tender?.budget_from ?? tender?.budget ?? ""}
              id="budget_from"
              min="0"
              name="budget_from"
              step="1000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_to">Бюджет до</Label>
            <NumberInput
              defaultValue={tender?.budget_to ?? ""}
              id="budget_to"
              min="0"
              name="budget_to"
              step="1000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Дедлайн</Label>
            <DatePicker
              defaultValue={tender?.deadline?.slice(0, 10) ?? ""}
              name="deadline"
            />
          </div>
          <div className="space-y-2">
            <Label>Статус</Label>
            <FormSelect
              defaultValue={tender?.status ?? "draft"}
              name="status"
              options={[
                { value: "draft", label: "Черновик" },
                { value: "published", label: "Опубликована" },
                ...(tender
                  ? [
                      { value: "closed", label: "Закрыта" },
                      { value: "archived", label: "В архиве" },
                    ]
                  : []),
              ]}
            />
          </div>

          {message ? (
            <Alert className="md:col-span-2" variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
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
