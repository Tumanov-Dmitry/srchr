"use client"

import { useState } from "react"
import { Share2 } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"

export function MaterialShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    try {
      const url = window.location.href
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // The native share dialog may be intentionally cancelled.
    }
  }

  return (
    <Button onClick={() => void share()} type="button" variant="outline">
      <Share2 /> {copied ? "Ссылка скопирована" : "Поделиться"}
    </Button>
  )
}
