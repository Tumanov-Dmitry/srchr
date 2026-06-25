import Link from "next/link"
import { Building2, UserRound } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/srchr/section-card"

type UniversalDashboardProps = {
  email?: string | null
}

export function UniversalDashboard({ email }: UniversalDashboardProps) {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <p className="text-sm font-medium text-primary">Добро пожаловать</p>
      <h1 className="type-h1 mt-2">
        Настройте рабочее пространство
      </h1>
      <p className="type-body mt-3 text-muted-foreground">
        {email ? `${email} · ` : ""}Создайте экспертный профиль или добавьте
        организацию, чтобы получить персональный dashboard.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <SectionCard title="Экспертный профиль">
          <UserRound className="size-6 text-primary" />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Публикуйте опыт, откликайтесь на задачи и развивайте личную
            репутацию.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/onboarding">Создать профиль</Link>
          </Button>
        </SectionCard>
        <SectionCard title="Организация">
          <Building2 className="size-6 text-primary" />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Представляйте агентство или компанию и работайте вместе с командой.
          </p>
          <Button asChild className="mt-5" variant="outline">
            <Link href="/dashboard/onboarding">Добавить организацию</Link>
          </Button>
        </SectionCard>
      </div>
    </div>
  )
}
