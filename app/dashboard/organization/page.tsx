import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function OrganizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Организация</h1>
        <p className="mt-2 text-muted-foreground">
          Базовая форма управления организацией. Сохранение подключается отдельной задачей.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Профиль организации</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input id="name" placeholder="Название компании" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Город</Label>
              <Input id="city" placeholder="Москва" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" placeholder="Чем занимается организация" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Сайт</Label>
              <Input id="website" placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Минимальный бюджет</Label>
              <Input id="budget" type="number" placeholder="300000" />
            </div>
            <div className="md:col-span-2">
              <Button type="button">Сохранить черновик</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
