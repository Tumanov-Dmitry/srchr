import { CaseCard } from "@/components/cases/case-card"
import { PageHeader, PageShell } from "@/components/layout/page-shell"
import { getPublishedCases } from "@/lib/supabase/queries"
import type { CaseItem } from "@/types"

export default async function CasesPage() {
  const cases = await getPublishedCases()

  return (
    <PageShell>
      <PageHeader
        title="Кейсы"
        description="Опубликованные работы подрядчиков из базы SRCHR."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {(cases as CaseItem[]).map((item) => (
          <CaseCard key={item.id} item={item} />
        ))}
      </div>
    </PageShell>
  )
}
