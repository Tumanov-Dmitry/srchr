import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Медиа</h1>
          <p className="mt-2 text-muted-foreground">
            Публикации, материалы и кейсы организации.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/media/new">Добавить материал</Link>
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Материалы</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          В MVP здесь появятся созданные кейсы и статьи. Сейчас кейсы сохраняются в
          существующую таблицу cases, а для единой сущности материалов подготовлен
          SQL-файл supabase/sql/create-materials.sql.
        </CardContent>
      </Card>
    </div>
  )
}
