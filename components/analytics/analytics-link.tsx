"use client"

import type { AnchorHTMLAttributes, MouseEvent } from "react"
import type { AnalyticsEventType } from "@/lib/analytics"

type AnalyticsLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventType: AnalyticsEventType
  targetType: string
  targetId: string
  source?: string
}

export function AnalyticsLink({
  eventType,
  targetType,
  targetId,
  source,
  onClick,
  ...props
}: AnalyticsLinkProps) {
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

  return <a {...props} onClick={handleClick} />
}
