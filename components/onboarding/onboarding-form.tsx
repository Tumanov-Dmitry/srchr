"use client"

import { Building2, Search, UserRound } from "lucide-react"
import { useEffect, useState } from "react"
import { completeOnboarding } from "@/app/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { MarketRole, Organization } from "@/types"

const roles: Array<{
  value: MarketRole
  title: string
  description: string
}> = [
  {
    value: "agency",
    title: "Представляю агентство / подрядчика",
    description: "Создавайте профиль агентства и откликайтесь на задачи.",
  },
  {
    value: "company",
    title: "Представляю компанию / заказчика",
    description: "Публикуйте задачи и управляйте корпоративным профилем.",
  },
  {
    value: "independent",
    title: "Я независимый эксперт",
    description: "Публикуйтесь и откликайтесь от собственного имени.",
  },
]

export function OnboardingForm({ message }: { message?: string }) {
  const [marketRole, setMarketRole] = useState<MarketRole>("independent")
  const [organizationAction, setOrganizationAction] = useState<
    "none" | "request" | "create"
  >("none")
  const [query, setQuery] = useState("")
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setOrganizations([])
      return
    }

    const timeout = window.setTimeout(() => {
      fetch(`/api/organizations/search?q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((result) => setOrganizations(result.organizations ?? []))
        .catch(() => setOrganizations([]))
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [query])

  return (
    <form action={completeOnboarding} className="space-y-6">
      <input name="market_role" type="hidden" value={marketRole} />
      <input
        name="organization_action"
        type="hidden"
        value={organizationAction}
      />
      <input
        name="organization_id"
        type="hidden"
        value={selectedOrganization?.id ?? ""}
      />

      <Card>
        <CardHeader>
          <CardTitle>1. Ваш экспертный профиль</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Имя" name="name" />
          <Field label="Фамилия" name="last_name" />
          <Field label="Должность" name="position" />
          <Field label="Город" name="city" />
          <Field
            className="md:col-span-2"
            label="Специализации"
            name="specializations"
            placeholder="HR-брендинг, исследования, коммуникации"
          />
          <Field
            className="md:col-span-2"
            label="Навыки"
            name="skills"
            placeholder="Стратегия, аналитика, копирайтинг"
          />
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Краткое описание</Label>
            <Textarea id="description" name="description" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Кто вы на рынке?</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {roles.map((role) => (
            <button
              className={`min-h-36 rounded-md border p-4 text-left transition-colors ${
                marketRole === role.value
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent"
              }`}
              key={role.value}
              onClick={() => {
                setMarketRole(role.value)
                setOrganizationAction("none")
                setSelectedOrganization(null)
              }}
              type="button"
            >
              {role.value === "independent" ? (
                <UserRound className="mb-3 h-5 w-5 text-primary" />
              ) : (
                <Building2 className="mb-3 h-5 w-5 text-primary" />
              )}
              <span className="block font-medium">{role.title}</span>
              <span className="mt-2 block text-sm text-muted-foreground">
                {role.description}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {marketRole !== "independent" ? (
        <Card>
          <CardHeader>
            <CardTitle>3. Организация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization_search">
                Найдите существующую организацию
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  id="organization_search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Начните вводить название"
                  value={query}
                />
              </div>
            </div>

            {organizations.length > 0 ? (
              <div className="grid gap-2">
                {organizations.map((organization) => (
                  <button
                    className={`rounded-md border p-3 text-left ${
                      selectedOrganization?.id === organization.id
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    key={organization.id}
                    onClick={() => {
                      setSelectedOrganization(organization)
                      setOrganizationAction("request")
                    }}
                    type="button"
                  >
                    <span className="font-medium">{organization.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {organization.city}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {selectedOrganization ? (
              <div className="rounded-md bg-secondary p-4 text-sm">
                Доступ будет запрошен у владельцев организации{" "}
                <strong>{selectedOrganization.name}</strong>.
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">или</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              onClick={() => {
                setOrganizationAction("create")
                setSelectedOrganization(null)
              }}
              type="button"
              variant={organizationAction === "create" ? "default" : "outline"}
            >
              Создать новую организацию
            </Button>

            {organizationAction === "create" ? (
              <div className="grid gap-4 rounded-md border p-4 md:grid-cols-2">
                <Field label="Название" name="organization_name" />
                <Field label="Город" name="organization_city" />
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="organization_description">Описание</Label>
                  <Textarea
                    id="organization_description"
                    name="organization_description"
                  />
                </div>
                <Field label="Сайт" name="website" />
                <Field label="Логотип URL" name="logo_url" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {message ? <p className="text-sm text-destructive">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button name="intent" size="lg" type="submit" value="complete">
          Сохранить и продолжить
        </Button>
        <Button
          name="intent"
          size="lg"
          type="submit"
          value="skip"
          variant="outline"
        >
          Заполнить позже
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  )
}
