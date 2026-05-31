"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ResponseForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>
}) {
  return (
    <form action={action} className="space-y-4 rounded-lg border bg-card p-5">
      <div className="space-y-2">
        <Label htmlFor="message">Отклик</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Коротко расскажите, как можете помочь с задачей"
        />
      </div>
      <Button type="submit">Отправить отклик</Button>
    </form>
  )
}
