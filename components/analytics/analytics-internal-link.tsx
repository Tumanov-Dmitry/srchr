"use client"

import Link from "next/link"
import type { ComponentProps, MouseEvent } from "react"
import type { AnalyticsEventType } from "@/lib/analytics"

type AnalyticsInternalLinkProps = ComponentProps<typeof Link> & {
  eventType: AnalyticsEventType
  targetType: string
  targetId: string
  source?: string
}

export function AnalyticsInternalLink({
  eventType,
  targetType,
  targetId,
  source,
  onClick,
  ...props
}: AnalyticsInternalLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        target_type: targetType,
        target_id: targetId,
        source,
      }),
      keepalive: true,
    }).catch(() => undefined)
  }

  return <Link {...props} onClick={handleClick} />
}
