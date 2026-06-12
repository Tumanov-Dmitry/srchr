import Link from "next/link"

import { PageHeader, SectionCard } from "@/components/srchr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpenText, ChevronRight, Search } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import {
  getKnowledgeModules,
  getKnowledgeStatusLabel,
} from "@/lib/knowledge-base"

export default async function AdminKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q = "", category = "" } = await searchParams
  const modules = await getKnowledgeModules()
  const normalizedQuery = q.trim().toLocaleLowerCase("ru-RU")
  const categories = [...new Set(modules.map((module) => module.category))]
  const filteredModules = modules.filter((module) => {
    const matchesCategory = !category || module.category === category
    const haystack = [
      module.title,
      module.summary,
      module.category,
      ...module.tags,
    ]
      .join(" ")
      .toLocaleLowerCase("ru-RU")

    return (
      matchesCategory &&
      (!normalizedQuery || haystack.includes(normalizedQuery))
    )
  })

  return (
    <div className="space-y-8">
      <PageHeader
        description="Живая документация по бизнес-логике, данным и технической реализации SRCHR."
        eyebrow="Только для администраторов"
        title="База знаний"
      />

      <SectionCard>
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              defaultValue={q}
              name="q"
              placeholder="Найти модуль или функцию"
            />
          </label>
          <select
            aria-label="Категория"
            className="w-full"
            defaultValue={category}
            name="category"
          >
            <option value="">Все категории</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Button type="submit">Найти</Button>
        </form>
      </SectionCard>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="type-h3">Модули</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredModules.length} из {modules.length}
          </p>
        </div>
        {(q || category) && (
          <Button asChild variant="ghost">
            <Link href="/admin/knowledge">Сбросить фильтры</Link>
          </Button>
        )}
      </div>

      {filteredModules.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredModules.map((module) => (
            <Link
              className="group rounded-2xl border bg-card p-5 shadow-elevation-1 transition hover:border-primary/40 hover:shadow-elevation-2"
              href={`/admin/knowledge/${module.slug}`}
              key={module.slug}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                    <BookOpenText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {module.category}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {module.title}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {module.summary}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    module.status === "active"
                      ? "bg-primary/10 text-primary"
                      : undefined
                  }
                  variant="secondary"
                >
                  {getKnowledgeStatusLabel(module.status)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Обновлено{" "}
                  {new Date(module.updatedAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <SectionCard>
          <div className="py-10 text-center">
            <BookOpenText className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">Ничего не найдено</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Попробуйте изменить запрос или категорию.
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
