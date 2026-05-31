import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/layout/page-shell"

export default function HomePage() {
  return (
    <PageShell className="py-16">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-primary">
            SRCHR MVP
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
            Платформа для поиска подрядчиков, медиа и задач
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Стартовая версия соединяет каталог организаций, опубликованные материалы,
            задачи и личный кабинет пользователя.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/contractors">
                Найти подрядчика
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/tenders">Смотреть задачи</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="grid gap-4">
            {["Авторизация", "Каталог", "Медиа", "Dashboard"].map((item) => (
              <div key={item} className="rounded-md border bg-background p-4">
                <div className="font-medium">{item}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Базовый модуль готов для дальнейшего развития.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  )
}
