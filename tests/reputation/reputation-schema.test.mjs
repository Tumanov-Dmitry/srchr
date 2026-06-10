import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const sql = await readFile(
  new URL("../../supabase/sql/create-reputation.sql", import.meta.url),
  "utf8",
)

test("reputation values live in database rules", () => {
  assert.match(sql, /create table if not exists public\.reputation_rules/)
  assert.match(sql, /default_points integer not null/)
  assert.match(sql, /private\.reprice_reputation_events/)
})

test("reputation events are idempotent and update summaries", () => {
  assert.match(sql, /reputation_events_unique_source_idx/)
  assert.match(sql, /reputation_events_refresh_summary/)
  assert.match(sql, /private\.refresh_reputation_summary/)
  assert.match(sql, /private\.refresh_reputation_breakdown/)
  assert.match(sql, /create table if not exists public\.reputation_breakdown/)
})

test("clients cannot directly mutate reputation totals or events", () => {
  assert.match(
    sql,
    /revoke insert, update, delete on public\.reputation_events from anon, authenticated/,
  )
  assert.match(
    sql,
    /revoke insert, update, delete on public\.reputation_summary from anon, authenticated/,
  )
  assert.match(
    sql,
    /revoke insert, update, delete on public\.reputation_breakdown from anon, authenticated/,
  )
  assert.doesNotMatch(
    sql,
    /grant insert(?:, update)?,?(?: delete)? on public\.reputation_events to authenticated/,
  )
})

test("public detail exposes aggregates instead of raw event history", () => {
  assert.match(sql, /"Reputation breakdowns are public"/)
  assert.match(sql, /"Target owners can read reputation events"/)
  assert.doesNotMatch(sql, /"Reputation events are public"/)
})

test("reviews keep questionnaire answers separate from public scoring", () => {
  assert.match(sql, /create table if not exists public\.reviews/)
  assert.match(sql, /create table if not exists public\.review_answers/)
  assert.match(sql, /score is null or score between 1 and 5/)
})
