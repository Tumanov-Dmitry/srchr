import Link from "next/link"
import { redirect } from "next/navigation"
import { setContractorPublicationStatus } from "@/app/actions/contractor-profile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentContractorOrganization } from "@/lib/supabase/queries"
import { formatMoney } from "@/lib/utils"

export default async function ContractorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams
  const { organization, profile, services } = await getCurrentContractorOrganization()

  if (!organization) {
    redirect("/onboarding")
  }

  const website = organization.website_url ?? organization.website
  const serviceNames = services
    .map((item) => item.services?.name)
    .filter((name): name is string => Boolean(name))
  const isPublished = organization.status === "published"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="type-h1">
            Кабинет подрядчика
          </h1>
          <p className="type-body mt-2 text-muted-foreground">
            {organization.name} · профиль, медиа и отклики.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Публичная ссылка: /contractors/{organization.slug}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <Button asChild variant="outline">
            <Link href="/dashboard/contractor/profile">Редактировать профиль</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/media">Добавить материал</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/contractor/responses">Мои отклики</Link>
          </Button>
        </div>
      </div>

      {message ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Организация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="text-sm text-muted-foreground">Название</div>
              <div className="font-medium">{organization.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Описание</div>
              <p className="mt-1 whitespace-pre-line leading-7">
                {organization.description ?? "Описание не заполнено."}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Город</div>
                <div className="font-medium">{organization.city ?? "Не указан"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Сайт</div>
                <div className="font-medium">{website ?? "Не указан"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Статус</div>
                <Badge>{organization.status ?? "draft"}</Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  В каталоге видны только подрядчики со статусом published.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Услуги</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {serviceNames.map((service) => (
                  <Badge key={service} variant="outline">
                    {service}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Услуги пока не выбраны.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Профиль подрядчика</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Краткое описание</div>
            <p className="mt-1 leading-7">
              {profile?.short_description ?? profile?.description ?? "Не заполнено."}
            </p>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Минимальный бюджет</div>
            <div className="mt-1 font-medium">{formatMoney(profile?.min_budget)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Размер команды</div>
            <div className="mt-1 font-medium">
              {profile?.team_size ? `${profile.team_size} чел.` : "Не указан"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Сайт профиля</div>
            <div className="mt-1 font-medium">{website ?? "Не указан"}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm text-muted-foreground">Полное описание</div>
            <p className="mt-1 whitespace-pre-line leading-7">
              {profile?.full_description ?? "Не заполнено."}
            </p>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Цены</div>
            <p className="mt-1 leading-7">
              {profile?.price_description ?? "Не заполнено."}
            </p>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Контакты</div>
            <p className="mt-1 leading-7">
              {profile?.contact_email ?? "Email не указан"}
              <br />
              {profile?.contact_phone ?? "Телефон не указан"}
              <br />
              {profile?.telegram_url ?? "Telegram не указан"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
