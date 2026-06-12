import Link from "next/link"
import {
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Search,
  UserRound,
} from "lucide-react"

import { PageShell } from "@/components/layout/page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const directions = [
  {
    href: "/contractors",
    title: "Подрядчики",
    description: "Агентства и команды для HR, бренда и коммуникаций.",
    icon: Building2,
    accent: "bg-primary text-primary-foreground",
  },
  {
    href: "/experts",
    title: "Эксперты",
    description: "Специалисты с опытом, кейсами и открытыми контактами.",
    icon: UserRound,
    accent: "bg-srchr-pink/30 text-foreground",
  },
  {
    href: "/tenders",
    title: "Задачи",
    description: "Открытые запросы компаний и возможность откликнуться.",
    icon: BriefcaseBusiness,
    accent: "bg-srchr-yellow text-foreground",
  },
  {
    href: "/media",
    title: "Медиа",
    description: "Кейсы, статьи и практические материалы сообщества.",
    icon: BookOpenText,
    accent: "bg-foreground text-background",
  },
]

export default function HomePage() {
  return (
    <PageShell className="space-y-16 pb-20 pt-10 sm:pt-14">
      <section className="grid gap-10 border-b pb-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-end">
        <div>
          <Badge
            className="mb-6 bg-srchr-pink/20 text-foreground"
            variant="outline"
          >
            Профессиональное сообщество
          </Badge>
          <h1 className="type-display max-w-4xl">
            Находите людей и команды, с которыми хочется работать
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Подрядчики, эксперты, реальные кейсы, отраслевые события и задачи
            компаний в одном рабочем пространстве.
          </p>
        </div>
        <Card className="border-primary/20 bg-card shadow-elevation-2">
          <CardContent className="space-y-4 p-5">
            <p className="text-sm font-semibold">С чего начнём?</p>
            <form action="/contractors" className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Поиск подрядчиков"
                className="h-12 pl-10 pr-28"
                name="q"
                placeholder="Услуга или компания"
              />
              <Button
                className="absolute right-1 top-1 h-10"
                size="sm"
                type="submit"
              >
                Найти
              </Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {["HR-брендинг", "EVP", "Исследования"].map((item) => (
                <Button asChild key={item} size="sm" variant="secondary">
                  <Link href={`/contractors?q=${encodeURIComponent(item)}`}>
                    {item}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="type-caption mb-2 text-primary">КАТАЛОГ SRCHR</p>
            <h2 className="type-h2">Выберите направление</h2>
          </div>
          <Button asChild variant="ghost">
            <Link href="/contractors">
              Смотреть каталог
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {directions.map((item) => {
            const Icon = item.icon
            return (
              <Link href={item.href} key={item.href}>
                <Card className="group h-full shadow-elevation-1 transition-colors hover:border-primary/40">
                  <CardContent className="flex h-full flex-col p-5">
                    <span
                      className={`mb-8 grid size-11 place-items-center rounded-lg ${item.accent}`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                    <ArrowRight className="mt-6 size-5 transition-transform group-hover:translate-x-1" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid overflow-hidden rounded-xl border bg-foreground text-background lg:grid-cols-[1fr_auto]">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm text-background/70">
            <CalendarDays className="size-4" />
            Календарь сообщества
          </div>
          <h2 className="type-h2 mt-4 max-w-2xl">
            Встречайтесь, выступайте и находите новые связи
          </h2>
          <p className="mt-3 max-w-xl text-background/70">
            Конференции, митапы, вебинары и образовательные события.
          </p>
        </div>
        <div className="flex items-end p-6 sm:p-8">
          <Button
            asChild
            className="bg-background text-foreground hover:bg-background/90"
          >
            <Link href="/events">
              Открыть мероприятия
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </PageShell>
  )
}
