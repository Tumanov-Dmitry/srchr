"use client"

import { useEffect } from "react"
import type { AnalyticsEventType } from "@/lib/analytics"

type AnalyticsTrackerProps = {
  eventType: AnalyticsEventType
  targetType: string
  targetId: string
  source?: string
}

function getVisitorKey() {
  const storageKey = "srchr_analytics_visitor"
  const existing = window.localStorage.getItem(storageKey)
  if (existing) return existing

  const created = crypto.randomUUID()
  window.localStorage.setItem(storageKey, created)
  return created
}

export function AnalyticsTracker({
  eventType,
  targetType,
  targetId,
  source,
}: AnalyticsTrackerProps) {
  useEffect(() => {
    const onceKey = `srchr_analytics:${eventType}:${targetType}:${targetId}`
    if (window.sessionStorage.getItem(onceKey)) return
    window.sessionStorage.setItem(onceKey, "1")

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        target_type: targetType,
        target_id: targetId,
        source,
        visitor_key: getVisitorKey(),
      }),
      keepalive: true,
    }).catch(() => undefined)
  }, [eventType, source, targetId, targetType])

  return null
}
