"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function NotificationReadButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function markRead() {
    setPending(true)
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      })
      if (response.ok) router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      disabled={pending}
      onClick={() => void markRead()}
      size="sm"
      type="button"
      variant="ghost"
    >
      ОК
    </Button>
  )
}
