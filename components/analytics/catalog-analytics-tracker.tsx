"use client"

import { useEffect } from "react"

const catalogTargetId = "00000000-0000-4000-8000-000000000000"

export function CatalogAnalyticsTracker({
  catalog,
  filters,
}: {
  catalog: "contractors" | "experts" | "media" | "events" | "tenders" | "search"
  filters: Record<string, string | undefined>
}) {
  useEffect(() => {
    window.sessionStorage.setItem(
      "srchr_analytics_catalog_source",
      JSON.stringify({ source: catalog, createdAt: Date.now() }),
    )

    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => Boolean(value)),
    )
    if (Object.keys(activeFilters).length === 0) return

    const eventType =
      typeof activeFilters.q === "string" && activeFilters.q
        ? "search"
        : "filter_used"
    const onceKey = `srchr_catalog_analytics:${catalog}:${JSON.stringify(activeFilters)}`
    if (window.sessionStorage.getItem(onceKey)) return
    window.sessionStorage.setItem(onceKey, "1")

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        target_type: "catalog",
        target_id: catalogTargetId,
        source: catalog,
        metadata: activeFilters,
      }),
      keepalive: true,
    }).catch(() => undefined)
  }, [catalog, filters])

  return null
}
