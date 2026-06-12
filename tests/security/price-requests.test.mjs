import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const sql = await readFile(
  new URL("../../supabase/sql/create-price-requests.sql", import.meta.url),
  "utf8",
)
const actions = await readFile(
  new URL("../../app/actions/price-requests.ts", import.meta.url),
  "utf8",
)

test("price requests are additive and protected by RLS", () => {
  assert.match(sql, /create table if not exists public\.price_requests/i)
  assert.match(
    sql,
    /create table if not exists public\.price_request_responses/i,
  )
  assert.match(
    sql,
    /alter table public\.price_requests enable row level security/i,
  )
  assert.match(
    sql,
    /alter table public\.price_request_responses enable row level security/i,
  )
  assert.doesNotMatch(sql, /alter table public\.tenders add column/i)
})

test("response ownership and ranges are validated", () => {
  assert.match(sql, /price_request_responses_owner_check/i)
  assert.match(sql, /max_cost >= min_cost/i)
  assert.match(sql, /max_duration_days >= min_duration_days/i)
  assert.match(actions, /canManageOrganization/)
  assert.match(actions, /profile\?\.id !== responderId/)
})

test("conversion creates a normal tender without changing tender schema", () => {
  assert.match(actions, /\.from\("tenders"\)\s*\.insert/s)
  assert.match(actions, /status: "converted_to_tender"/)
  assert.match(actions, /converted_tender_id/)
})

test("published price requests notify their author", () => {
  assert.match(actions, /recipient_id: user\.id/)
  assert.match(actions, /Запрос стоимости опубликован/)
  assert.match(actions, /target_url: `\/price-requests\/\$\{requestId\}`/)
})
