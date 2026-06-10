"use client"

import Link from "next/link"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Service } from "@/types"

export function ContractorFilters({
  services,
  defaultCity,
  defaultService,
  defaultBudget,
  defaultSort,
}: {
  services: Service[]
  defaultCity?: string
  defaultService?: string
  defaultBudget?: string
  defaultSort?: string
}) {
  return (
    <form className="mb-8 grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-5">
      <div className="space-y-2">
        <Label htmlFor="city">Город</Label>
        <Input
          id="city"
          name="city"
          placeholder="Москва"
          defaultValue={defaultCity}
        />
      </div>
      <div className="space-y-2">
        <Label>Сортировка</Label>
        <Select name="sort" defaultValue={defaultSort ?? "name"}>
          <SelectTrigger>
            <SelectValue placeholder="По названию" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">По названию</SelectItem>
            <SelectItem value="reputation">По репутации</SelectItem>
            <SelectItem value="reviews">По отзывам</SelectItem>
            <SelectItem value="recommendations">По рекомендациям</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Услуга</Label>
        <Select name="service" defaultValue={defaultService}>
          <SelectTrigger>
            <SelectValue placeholder="Любая услуга" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Бюджет</Label>
        <Select name="budget" defaultValue={defaultBudget}>
          <SelectTrigger>
            <SelectValue placeholder="Любой бюджет" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="100000">до 100 000 ₽</SelectItem>
            <SelectItem value="500000">до 500 000 ₽</SelectItem>
            <SelectItem value="1000000">до 1 000 000 ₽</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" className="flex-1">
          <Search className="h-4 w-4" />
          Применить
        </Button>
        <Button asChild variant="outline" size="icon">
          <Link href="/contractors" aria-label="Сбросить фильтры">
            <X className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </form>
  )
}
