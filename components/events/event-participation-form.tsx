"use client"

import { useFormStatus } from "react-dom"
import { setEventParticipation } from "@/app/actions/events"
import { Button } from "@/components/ui/button"
import type { EventParticipationStatus } from "@/types"

const options: Array<{ value: EventParticipationStatus; label: string }> = [
  { value: "going", label: "Пойду" },
  { value: "interested", label: "Интересно" },
  { value: "not_going", label: "Не пойду" },
]

function SubmitButton({
  value,
  label,
  active,
}: {
  value: EventParticipationStatus
  label: string
  active: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      disabled={pending}
      name="status"
      type="submit"
      value={value}
      variant={active ? "default" : "outline"}
    >
      {label}
    </Button>
  )
}

export function EventParticipationForm({
  eventId,
  slug,
  currentStatus,
}: {
  eventId: string
  slug: string
  currentStatus?: EventParticipationStatus | null
}) {
  return (
    <form action={setEventParticipation} className="flex flex-wrap gap-2">
      <input name="event_id" type="hidden" value={eventId} />
      <input name="slug" type="hidden" value={slug} />
      {options.map((option) => (
        <SubmitButton
          active={currentStatus === option.value}
          key={option.value}
          label={option.label}
          value={option.value}
        />
      ))}
    </form>
  )
}
