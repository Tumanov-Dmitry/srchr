import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const sqlPath = new URL(
  "../../supabase/sql/create-analytics.sql",
  import.meta.url,
)
const analyticsPath = new URL("../../lib/analytics.ts", import.meta.url)
const apiPath = new URL(
  "../../app/api/analytics/events/route.ts",
  import.meta.url,
)

test("analytics SQL is additive, aggregated, and protected by RLS", async () => {
  const sql = await readFile(sqlPath, "utf8")

  assert.match(sql, /alter table public\.analytics_events/i)
  assert.match(sql, /create table if not exists public\.analytics_daily_stats/i)
  assert.match(
    sql,
    /create table if not exists public\.analytics_public_totals/i,
  )
  assert.match(
    sql,
    /create table if not exists public\.analytics_object_dimensions/i,
  )
  assert.match(
    sql,
    /create table if not exists public\.analytics_tender_facts/i,
  )
  assert.match(sql, /create table if not exists public\.market_survey_answers/i)
  assert.match(sql, /enable row level security/i)
  assert.match(sql, /private\.can_view_analytics/i)
  assert.match(sql, /analytics_events_aggregate_trigger/i)
  assert.match(sql, /unique_views/i)
  assert.match(sql, /increment_public_view/i)
  assert.doesNotMatch(sql, /drop table/i)
})

test("analytics writes are server-side, allowlisted, and non-blocking", async () => {
  const [analytics, api] = await Promise.all([
    readFile(analyticsPath, "utf8"),
    readFile(apiPath, "utf8"),
  ])

  assert.match(analytics, /analyticsEventTypes/)
  assert.match(analytics, /createAdminClient/)
  assert.match(analytics, /catch \(error\)/)
  assert.match(api, /resolveAnalyticsTarget/)
  assert.match(api, /checkRateLimit/)
  assert.match(api, /supabase\.auth\.getUser/)
  assert.match(api, /isCatalogEvent/)
})

test("raw analytics tables are not writable by browser roles", async () => {
  const sql = await readFile(sqlPath, "utf8")

  assert.match(
    sql,
    /revoke all on public\.analytics_events from anon, authenticated/i,
  )
  assert.match(
    sql,
    /grant select on public\.analytics_events to authenticated/i,
  )
  assert.doesNotMatch(
    sql,
    /grant (insert|all) on public\.analytics_events to authenticated/i,
  )
  assert.match(
    sql,
    /grant select on public\.analytics_public_totals to anon, authenticated/i,
  )
})
