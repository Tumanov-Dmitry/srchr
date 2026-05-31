import { AdminMaterialsTable } from "@/components/admin/materials-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { decodeMessage } from "@/lib/messages"
import { getAdminMaterials } from "@/lib/supabase/admin-queries"

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message: rawMessage } = await searchParams
  const message = decodeMessage(rawMessage)
  const materials = await getAdminMaterials("article")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Статьи</h1>
        <p className="mt-2 text-muted-foreground">
          Управление экспертными материалами, рубриками и публикацией.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Статьи</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminMaterialsTable materials={materials} />
        </CardContent>
      </Card>
    </div>
  )
}
