import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardMediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Медиа</h1>
          <p className="mt-2 text-muted-foreground">
            Публикации, материалы и кейсы организации.
          </p>
        </div>
        <Button>Новый материал</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Материалы</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Здесь будет список медиа-материалов, связанных с организациями пользователя.
        </CardContent>
      </Card>
    </div>
  )
}
