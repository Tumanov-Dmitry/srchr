import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Избранное</h1>
        <p className="mt-2 text-muted-foreground">
          Сохраненные подрядчики, кейсы и задачи.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Избранное</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Модуль готов к подключению таблицы favorites.
        </CardContent>
      </Card>
    </div>
  )
}
