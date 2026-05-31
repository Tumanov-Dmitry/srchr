"use client"

import { Button } from "@/components/ui/button"
import { RequiredLabel } from "@/components/ui/required-label"
import { Textarea } from "@/components/ui/textarea"

export function ResponseForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>
}) {
  return (
    <form action={action} className="space-y-4 rounded-lg border bg-card p-5">
      <div className="space-y-2">
        <RequiredLabel htmlFor="message" required>Отклик</RequiredLabel>
        <Textarea
          id="message"
          name="message"
          placeholder="Коротко расскажите, как можете помочь с задачей"
          required
        />
      </div>
      <Button type="submit">Отправить отклик</Button>
    </form>
  )
}
