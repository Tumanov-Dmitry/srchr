import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageShell } from "@/components/layout/page-shell"
import { getCaseBySlug } from "@/lib/supabase/queries"
import type { CaseItem } from "@/types"

type CaseBlock = {
  type?: string
  title?: string
  content?: string
}

function getCaseBlocks(content?: string | null) {
  if (!content) return null

  try {
    const parsed = JSON.parse(content) as { blocks?: CaseBlock[] }
    return Array.isArray(parsed.blocks) ? parsed.blocks : null
  } catch {
    return null
  }
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const item = (await getCaseBySlug(slug)) as CaseItem | null

  if (!item) notFound()

  const blocks = getCaseBlocks(item.content)

  return (
    <PageShell>
      <article className="mx-auto max-w-4xl">
        {item.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover_url} alt="" className="mb-8 h-80 w-full rounded-lg object-cover" />
        ) : null}
        <p className="mb-3 text-sm font-medium text-primary">
          {item.organizations?.name ?? "Организация"}
        </p>
        <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
          {item.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          {item.short_description ?? "Краткое описание кейса скоро появится."}
        </p>
        {blocks ? (
          <div className="mt-8 space-y-6">
            {blocks.map((block, index) => (
              <section key={`${block.type ?? "block"}-${index}`}>
                <h2 className="text-xl font-semibold tracking-normal">
                  {block.title}
                </h2>
                <p className="mt-2 whitespace-pre-line leading-8">
                  {block.content}
                </p>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-8 whitespace-pre-line leading-8">
            {item.content ?? "Полное описание кейса будет добавлено позже."}
          </div>
        )}
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Комментарии</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Комментарии будут подключены в следующих версиях.
          </CardContent>
        </Card>
      </article>
    </PageShell>
  )
}
