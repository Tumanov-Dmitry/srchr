import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8")
}

test("signup never accepts or stores a client-provided role", async () => {
  const auth = await source("app/actions/auth.ts")

  assert.doesNotMatch(auth, /formData\.get\(["']role["']\)/)
  assert.doesNotMatch(auth, /options:\s*\{\s*data:\s*\{\s*role/s)
  assert.match(auth, /role:\s*["']guest["']/)
})

test("user material and event actions never initialize an admin client", async () => {
  const [media, events] = await Promise.all([
    source("app/actions/media.ts"),
    source("app/actions/events.ts"),
  ])

  assert.doesNotMatch(media, /createAdminClient/)
  assert.doesNotMatch(events, /createAdminClient/)
})

test("notification SQL denies client-side event and notification creation", async () => {
  const notifications = await source("supabase/sql/create-notifications.sql")

  assert.doesNotMatch(
    notifications,
    /grant\s+select,\s*insert\s+on\s+public\.notification_events/i,
  )
  assert.doesNotMatch(
    notifications,
    /create policy "Authenticated users can create notification events"/i,
  )
  assert.doesNotMatch(
    notifications,
    /create policy "Users can insert own notifications"/i,
  )
})

test("database hardening protects roles and validates event ownership", async () => {
  const sql = await source("supabase/sql/security-hardening.sql")

  assert.match(sql, /protect_profile_authorization/)
  assert.match(sql, /authorization fields are managed by administrators/)
  assert.match(sql, /Users create events for owned profiles/)
  assert.match(sql, /private\.owns_expert\(owner_id\)/)
  assert.match(sql, /private\.is_org_member\(owner_id/)
})

test("material ownership supports experts without allowing arbitrary owners", async () => {
  const sql = await source("supabase/sql/fix-ownership-and-participation.sql")

  assert.match(sql, /owner_type = 'expert'/)
  assert.match(sql, /private\.owns_expert\(expert_id\)/)
  assert.match(sql, /private\.is_org_member\(/)
  assert.match(sql, /organization_id is null/)
  assert.match(sql, /company_id is null/)
})

test("event writes verify affected rows and participation requires publication", async () => {
  const [events, sql] = await Promise.all([
    source("app/actions/events.ts"),
    source("supabase/sql/fix-ownership-and-participation.sql"),
  ])

  assert.doesNotMatch(events, /data\.created_by === userId/)
  assert.match(events, /\.select\(["']id["']\)\s*\.maybeSingle\(\)/s)
  assert.match(sql, /e\.status in \('published', 'completed'\)/)
})

test("application sends baseline browser security headers", async () => {
  const config = await source("next.config.ts")

  for (const header of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Permissions-Policy",
    "Referrer-Policy",
  ]) {
    assert.match(config, new RegExp(header))
  }
})
