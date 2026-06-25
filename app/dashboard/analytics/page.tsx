import Link from "next/link"
import { redirect } from "next/navigation"
import { BarChart3 } from "@/components/ui/icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardAnalyticsOwners } from "@/lib/supabase/analytics-queries"

export default async function DashboardAnalyticsPage() {
  const { user, owners } = await getDashboardAnalyticsOwners()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1">Аналитика</h1>
        <p className="type-body mt-2 text-muted-foreground">
          Выберите профиль или организацию, статистику которых хотите открыть.
        </p>
      </div>
      {owners.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {owners.map((owner) => (
            <Link href={owner.href} key={`${owner.ownerType}:${owner.ownerId}`}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {owner.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {owner.ownerType === "expert"
                    ? "Аналитика экспертного профиля"
                    : "Аналитика организации и её публикаций"}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Создайте профиль эксперта или получите роль owner, admin либо editor
            в организации.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
