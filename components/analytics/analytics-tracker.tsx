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

const trafficSources = new Set([
  "direct",
  "search",
  "contractors",
  "experts",
  "media",
  "events",
  "tenders",
  "qr",
  "external",
])

function inferTrafficSource(preferred?: string) {
  if (preferred && trafficSources.has(preferred)) return preferred

  const currentSection = window.location.pathname.split("/").filter(Boolean)[0]
  const expectedCatalog = currentSection?.startsWith("@")
    ? "experts"
    : currentSection
  const storedSource = window.sessionStorage.getItem(
    "srchr_analytics_catalog_source",
  )

  if (storedSource) {
    window.sessionStorage.removeItem("srchr_analytics_catalog_source")
    try {
      const stored = JSON.parse(storedSource) as {
        source?: string
        createdAt?: number
      }
      if (
        stored.source === expectedCatalog &&
        typeof stored.createdAt === "number" &&
        Date.now() - stored.createdAt < 10 * 60_000
      ) {
        return stored.source
      }
    } catch {
      // Ignore malformed session data and use the referrer fallback.
    }
  }

  if (!document.referrer) return "direct"

  try {
    const referrer = new URL(document.referrer)
    const searchHosts = [
      "google.",
      "yandex.",
      "bing.",
      "duckduckgo.",
      "mail.ru",
    ]

    if (searchHosts.some((host) => referrer.hostname.includes(host))) {
      return "search"
    }
    if (referrer.origin !== window.location.origin) return "external"

    const section = referrer.pathname.split("/").filter(Boolean)[0]
    return trafficSources.has(section) ? section : "direct"
  } catch {
    return "direct"
  }
}

function referrerPath() {
  if (!document.referrer) return null

  try {
    const referrer = new URL(document.referrer)
    return referrer.origin === window.location.origin
      ? referrer.pathname.slice(0, 240)
      : null
  } catch {
    return null
  }
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
        source: inferTrafficSource(source),
        metadata: { referrer_path: referrerPath() },
        visitor_key: getVisitorKey(),
      }),
      keepalive: true,
    }).catch(() => undefined)
  }, [eventType, source, targetId, targetType])

  return null
}
