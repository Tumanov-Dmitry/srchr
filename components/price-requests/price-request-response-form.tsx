import { respondToPriceRequest } from "@/app/actions/price-requests"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"

export function PriceRequestResponseForm({
  requestId,
  options,
}: {
  requestId: string
  options: Array<{ value: string; label: string }>
}) {
  if (options.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Дать оценку</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={respondToPriceRequest}
          className="grid gap-5 md:grid-cols-2"
        >
          <input name="price_request_id" type="hidden" value={requestId} />
          <div className="space-y-2 md:col-span-2">
            <RequiredLabel htmlFor="responder" required>
              Ответить как
            </RequiredLabel>
            <FormSelect
              name="responder"
              options={options}
              placeholder="Выберите профиль"
            />
          </div>
          <NumberField label="Стоимость от, ₽" name="min_cost" />
          <NumberField label="Стоимость до, ₽" name="max_cost" />
          <NumberField label="Срок от, дней" min={1} name="min_duration_days" />
          <NumberField label="Срок до, дней" min={1} name="max_duration_days" />
          <div className="space-y-2 md:col-span-2">
            <RequiredLabel htmlFor="comment">Комментарий</RequiredLabel>
            <Textarea
              id="comment"
              name="comment"
              placeholder="Что входит в оценку, какие есть допущения"
              rows={5}
            />
          </div>
          <label className="flex items-center gap-3 text-sm md:col-span-2">
            <Checkbox
              defaultChecked
              id="willing_to_participate"
              name="willing_to_participate"
            />
            Готов участвовать в проекте, если запрос станет заданием
          </label>
          <Button className="md:col-span-2" type="submit">
            Отправить оценку
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function NumberField({
  label,
  name,
  min = 0,
}: {
  label: string
  name: string
  min?: number
}) {
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={name} required>
        {label}
      </RequiredLabel>
      <Input id={name} min={min} name={name} required step="1" type="number" />
    </div>
  )
}
