"use client"

import { useState } from "react"
import { completeOnboarding } from "@/app/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { OnboardingRole, Service } from "@/types"

export function OnboardingForm({
  services,
  message,
}: {
  services: Service[]
  message?: string
}) {
  const [role, setRole] = useState<OnboardingRole>("contractor")

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Настройка аккаунта</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={completeOnboarding} className="space-y-6">
          <div className="space-y-2">
            <Label>Роль</Label>
            <Select
              name="role"
              value={role}
              onValueChange={(value) => setRole(value as OnboardingRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contractor">Подрядчик</SelectItem>
                <SelectItem value="client">Компания / HR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                {role === "contractor" ? "Название компании" : "Название компании"}
              </Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Город</Label>
              <Input id="city" name="city" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" name="description" required />
            </div>

            {role === "contractor" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="website">Сайт</Label>
                  <Input id="website" name="website" placeholder="https://example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Логотип</Label>
                  <Input
                    id="logo_url"
                    name="logo_url"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="short_description">Краткое описание</Label>
                  <Textarea
                    id="short_description"
                    name="short_description"
                    placeholder="Коротко о специализации и сильных сторонах"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="full_description">Полное описание</Label>
                  <Textarea
                    id="full_description"
                    name="full_description"
                    placeholder="Опыт, подход, типовые проекты и результаты"
                    className="min-h-32"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_budget">Минимальный бюджет</Label>
                  <Input id="min_budget" name="min_budget" type="number" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team_size">Размер команды</Label>
                  <Input id="team_size" name="team_size" type="number" min="1" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="price_description">Описание цен</Label>
                  <Input
                    id="price_description"
                    name="price_description"
                    placeholder="Например: проекты от 300 000 ₽, поддержка по retainer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Контактный email</Label>
                  <Input id="contact_email" name="contact_email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Контактный телефон</Label>
                  <Input id="contact_phone" name="contact_phone" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="telegram_url">Telegram</Label>
                  <Input
                    id="telegram_url"
                    name="telegram_url"
                    placeholder="https://t.me/company"
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label>Услуги</Label>
                  <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
                    {services.length > 0 ? (
                      services.map((service) => (
                        <label
                          key={service.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            name="services"
                            value={service.id}
                            className="h-4 w-4 rounded border-input"
                          />
                          {service.name}
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Услуги пока не заполнены в справочнике services.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {message ? <p className="text-sm text-destructive">{message}</p> : null}

          <Button type="submit" size="lg">
            Завершить настройку
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
