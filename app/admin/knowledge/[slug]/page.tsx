import Link from "next/link"
import { notFound } from "next/navigation"

import { KnowledgeMarkdown } from "@/components/admin/knowledge-markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpenText } from "@/components/ui/icons"
import {
  getKnowledgeDocument,
  getKnowledgeModules,
  getKnowledgeStatusLabel,
} from "@/lib/knowledge-base"

export async function generateStaticParams() {
  const modules = await getKnowledgeModules()
  return modules.map((module) => ({ slug: module.slug }))
}

export default async function AdminKnowledgeDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [document, modules] = await Promise.all([
    getKnowledgeDocument(slug),
    getKnowledgeModules(),
  ])

  if (!document) {
    notFound()
  }

  const dependencies = document.dependsOn
    .map((dependency) => modules.find((module) => module.slug === dependency))
    .filter((module) => module !== undefined)

  return (
    <div className="space-y-6">
      <Button asChild size="sm" variant="ghost">
        <Link href="/admin/knowledge">
          <ArrowLeft className="h-4 w-4" />
          Все модули
        </Link>
      </Button>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <main className="min-w-0 rounded-2xl border bg-card p-6 shadow-elevation-1 sm:p-8">
          <div className="mb-8 flex flex-wrap items-center gap-2 border-b pb-6">
            <Badge>{document.category}</Badge>
            <Badge variant="secondary">
              {getKnowledgeStatusLabel(document.status)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Обновлено{" "}
              {new Date(document.updatedAt).toLocaleDateString("ru-RU")}
            </span>
          </div>
          <KnowledgeMarkdown content={document.content} />
        </main>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2 font-semibold">
              <BookOpenText className="h-4 w-4 text-primary" />
              На этой странице
            </div>
            <nav className="mt-4 grid gap-2">
              {document.headings.map((heading) => (
                <a
                  className="text-sm text-muted-foreground hover:text-foreground"
                  href={`#${heading.id}`}
                  key={heading.id}
                  style={{ paddingLeft: heading.depth === 3 ? 12 : 0 }}
                >
                  {heading.title}
                </a>
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <p className="text-sm font-semibold">Ответственные</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {document.owners.map((owner) => (
                <Badge key={owner} variant="outline">
                  {owner}
                </Badge>
              ))}
            </div>
            {dependencies.length > 0 && (
              <>
                <p className="mt-5 text-sm font-semibold">Зависит от</p>
                <div className="mt-3 grid gap-2">
                  {dependencies.map((dependency) => (
                    <Link
                      className="text-sm text-primary hover:underline"
                      href={`/admin/knowledge/${dependency.slug}`}
                      key={dependency.slug}
                    >
                      {dependency.title}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
