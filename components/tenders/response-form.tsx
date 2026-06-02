"use client"

import { Button } from "@/components/ui/button"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"

type ResponseOption = {
  value: "contractor" | "expert"
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
    <form action={action} className="space-y-4 rounded-lg border bg-card p-5">
      {options.length > 1 ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Как откликнуться?</legend>
          <div className="grid gap-2">
            {options.map((option) => (
              <label
                className="flex gap-3 rounded-md border p-3 text-sm"
                key={option.value}
              >
                <input
                  defaultChecked={option.value === defaultOption}
                  name="responder_type"
                  type="radio"
                  value={option.value}
                />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
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
  )
}
