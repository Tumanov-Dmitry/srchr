"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"

type ResponseOption = {
  value: string
  label: string
  description: string
}

export function ResponseForm({
  action,
  options,
}: {
  action: (formData: FormData) => void | Promise<void>
  options: ResponseOption[]
}) {
  const defaultOption = options[0]?.value

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-5">
          {options.length > 1 ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Как откликнуться?</legend>
              <RadioGroup defaultValue={defaultOption} name="responder_type">
                {options.map((option) => (
                  <label
                    className="flex cursor-pointer gap-3 rounded-lg border p-4 text-sm transition-colors hover:bg-muted"
                    key={option.value}
                  >
                    <RadioGroupItem value={option.value} />
                    <span>
                      <span className="block font-medium">{option.label}</span>
                      <span className="text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </fieldset>
          ) : defaultOption ? (
            <input name="responder_type" type="hidden" value={defaultOption} />
          ) : null}
          <div className="space-y-2">
            <RequiredLabel htmlFor="message" required>
              Отклик
            </RequiredLabel>
            <Textarea
              id="message"
              name="message"
              placeholder="Коротко расскажите, как можете помочь с задачей"
              required
            />
          </div>
          <Button disabled={options.length === 0} type="submit">
            Отправить отклик
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
