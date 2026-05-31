import Link from "next/link"
import { FileText, FolderKanban } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewMaterialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">
          Что хотите опубликовать?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Выберите формат материала. Кейс показывает выполненный проект, статья
          помогает делиться экспертизой.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/media/new/case">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FolderKanban className="h-5 w-5" />
              </div>
              <CardTitle>Кейс</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Практический разбор выполненного проекта: задача, процесс,
              результат, команда, клиент и метрики.
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/media/new/article">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle>Статья</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              Экспертный материал: гайд, подборка, исследование, мнение, обзор
              рынка или инструкция.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
