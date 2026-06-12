import { redirect } from "next/navigation"
import {
  setContractorPublicationStatus,
  updateContractorProfile,
} from "@/app/actions/contractor-profile"
import { ContractorSlugFields } from "@/components/contractors/contractor-slug-fields"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RequiredLabel } from "@/components/ui/required-label"
import { SelectField } from "@/components/ui/select-field"
import { Textarea } from "@/components/ui/textarea"
import { getCurrentContractorOrganization } from "@/lib/supabase/queries"

export default async function ContractorProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const [{ message }, { organization, profile }] = await Promise.all([
    searchParams,
    getCurrentContractorOrganization(),
  ])

  if (!organization) {
    redirect("/onboarding")
  }

  const website = organization.website_url ?? organization.website ?? ""
  const isPublished = organization.status === "published"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">
          Редактирование профиля
        </h1>
        <p className="mt-2 text-muted-foreground">
          Данные сохраняются в organizations и contractor_profiles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Публикация</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">
              Текущий статус: {isPublished ? "Опубликован" : "Черновик"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              В каталоге видны только подрядчики со статусом published.
            </p>
          </div>
          <form action={setContractorPublicationStatus}>
            <input
              type="hidden"
              name="status"
              value={isPublished ? "draft" : "published"}
            />
            <Button type="submit" variant={isPublished ? "outline" : "default"}>
              {isPublished ? "Снять с публикации" : "Опубликовать"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Профиль подрядчика</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={updateContractorProfile}
            className="grid gap-5 md:grid-cols-2"
          >
            <ContractorSlugFields
              defaultName={organization.name}
              defaultSlug={organization.slug}
              defaultWebsite={website}
            />
            <div className="space-y-2">
              <RequiredLabel htmlFor="city" required>
                Город
              </RequiredLabel>
              <Input
                id="city"
                name="city"
                defaultValue={organization.city ?? ""}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <RequiredLabel htmlFor="description" required>
                Описание организации
              </RequiredLabel>
              <Textarea
                id="description"
                name="description"
                defaultValue={organization.description ?? ""}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Статус публикации</Label>
              <SelectField
                name="status"
                defaultValue={organization.status ?? "draft"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="draft">Черновик</option>
                <option value="published">Опубликован</option>
              </SelectField>
              <p className="text-sm text-muted-foreground">
                Подрядчик появляется в публичном каталоге, когда статус
                опубликован.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="short_description">Краткое описание</Label>
              <Textarea
                id="short_description"
                name="short_description"
                defaultValue={
                  profile?.short_description ?? profile?.description ?? ""
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="full_description">Полное описание</Label>
              <Textarea
                id="full_description"
                name="full_description"
                defaultValue={profile?.full_description ?? ""}
                className="min-h-40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_budget">Минимальный бюджет</Label>
              <Input
                id="min_budget"
                name="min_budget"
                type="number"
                min="0"
                step="1000"
                defaultValue={profile?.min_budget ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team_size">Размер команды</Label>
              <Input
                id="team_size"
                name="team_size"
                type="number"
                min="1"
                step="1"
                defaultValue={profile?.team_size ?? ""}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="price_description">Описание цен</Label>
              <Input
                id="price_description"
                name="price_description"
                defaultValue={profile?.price_description ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Контактный email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                defaultValue={profile?.contact_email ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Контактный телефон</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                defaultValue={profile?.contact_phone ?? ""}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="telegram_url">Telegram</Label>
              <Input
                id="telegram_url"
                name="telegram_url"
                defaultValue={profile?.telegram_url ?? ""}
                placeholder="https://t.me/company"
              />
            </div>

            {message ? (
              <p className="text-sm text-destructive md:col-span-2">
                {message}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit">Сохранить</Button>
              <Button asChild type="button" variant="outline">
                <a href="/dashboard/contractor">Отмена</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
