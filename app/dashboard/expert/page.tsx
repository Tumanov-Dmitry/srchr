import Link from "next/link"
import { saveExpertProfile } from "@/app/actions/expert-profile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"
import { decodeMessage } from "@/lib/messages"
import { getCurrentExpertProfile } from "@/lib/supabase/queries"

export default async function DashboardExpertPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const { profile, organizations, isExpertTableMissing } =
    await getCurrentExpertProfile()

  return (
    <form action={saveExpertProfile} className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">
            Профиль эксперта
          </h1>
          <p className="mt-2 text-muted-foreground">
            Личная публичная страница специалиста поверх текущих компаний.
          </p>
        </div>
        {profile?.slug ? (
          <Button asChild variant="outline">
            <Link href={`/@${profile.slug}`}>Открыть /@{profile.slug}</Link>
          </Button>
        ) : null}
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      {isExpertTableMissing ? (
        <Card>
          <CardHeader>
            <CardTitle>Нужна таблица expert_profiles</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Примените SQL из supabase/sql/create-experts.sql, чтобы включить
            модуль экспертов.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Основное</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field
            defaultValue={profile?.first_name ?? ""}
            label="Имя"
            name="first_name"
            requiredLabel
          />
          <Field
            defaultValue={profile?.last_name ?? ""}
            label="Фамилия"
            name="last_name"
          />
          <Field
            defaultValue={profile?.slug ?? ""}
            label="Публичный slug"
            name="slug"
            placeholder="dmitry"
          />
          <Field
            defaultValue={profile?.avatar_url ?? ""}
            label="Фото / avatar URL"
            name="avatar_url"
            placeholder="https://..."
          />
          <Field
            defaultValue={profile?.position ?? ""}
            label="Должность"
            name="position"
          />
          <Field defaultValue={profile?.city ?? ""} label="Город" name="city" />
          <TextField
            className="md:col-span-2"
            defaultValue={profile?.short_description ?? ""}
            label="Краткое описание"
            name="short_description"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Профессиональная информация</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField
            defaultValue={profile?.specializations ?? ""}
            label="Специализации"
            name="specializations"
            placeholder="EVP, HR-брендинг, коммуникации"
          />
          <TextField
            defaultValue={profile?.skills ?? ""}
            label="Навыки"
            name="skills"
            placeholder="стратегия, исследования, копирайтинг"
          />
          <TextField
            defaultValue={profile?.activity_areas ?? ""}
            label="Направления деятельности"
            name="activity_areas"
          />
          <Field
            defaultValue={profile?.experience_years?.toString() ?? ""}
            label="Стаж, лет"
            name="experience_years"
            type="number"
          />
          <TextField
            className="md:col-span-2"
            defaultValue={profile?.experience_description ?? ""}
            label="Опыт работы"
            name="experience_description"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Контакты</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field
            defaultValue={profile?.contact_email ?? ""}
            label="Email"
            name="contact_email"
            type="email"
          />
          <Field
            defaultValue={profile?.telegram_url ?? ""}
            label="Telegram"
            name="telegram_url"
            placeholder="https://t.me/..."
          />
          <Field
            defaultValue={profile?.website_url ?? ""}
            label="Сайт"
            name="website_url"
            placeholder="https://..."
          />
          <Field
            defaultValue={profile?.linkedin_url ?? ""}
            label="LinkedIn"
            name="linkedin_url"
            placeholder="https://..."
          />
          <Field
            defaultValue={profile?.behance_url ?? ""}
            label="Behance"
            name="behance_url"
            placeholder="https://..."
          />
          <Field
            defaultValue={profile?.dribbble_url ?? ""}
            label="Dribbble"
            name="dribbble_url"
            placeholder="https://..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
              defaultChecked={Boolean(profile?.is_public)}
              name="is_public"
            />
            Публичный профиль
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
              defaultChecked={profile?.is_open_to_work ?? true}
              name="is_open_to_work"
            />
            Открыт к сотрудничеству
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Связанные организации</CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {organizations.map((membership) => (
                <Badge
                  key={membership.id ?? membership.organization_id}
                  variant="outline"
                >
                  {membership.organizations?.name ?? "Организация"} ·{" "}
                  {membership.role ?? "member"}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Организации появятся здесь через текущие связи
              organization_members.
            </p>
          )}
        </CardContent>
      </Card>

      <Button type="submit">Сохранить профиль эксперта</Button>
    </form>
  )
}

function Field({
  name,
  label,
  requiredLabel = false,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  name: string
  requiredLabel?: boolean
}) {
  const isNumber = props.type === "number"

  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name} required={requiredLabel}>
        {label}
      </RequiredLabel>
      {isNumber ? (
        <NumberInput
          defaultValue={props.defaultValue as string | number | undefined}
          id={name}
          name={name}
        />
      ) : (
        <Input id={name} name={name} {...props} />
      )}
    </div>
  )
}

function TextField({
  name,
  label,
  requiredLabel = false,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  label: string
  requiredLabel?: boolean
}) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <RequiredLabel htmlFor={name} required={requiredLabel}>
        {label}
      </RequiredLabel>
      <Textarea id={name} name={name} {...props} />
    </div>
  )
}
