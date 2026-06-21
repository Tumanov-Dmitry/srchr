import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8")
}

test("material uploads are bounded, validated, and removable", async () => {
  const upload = await source("app/api/materials/upload/route.ts")

  assert.match(upload, /hasValidSignature/)
  assert.match(upload, /maxUserStorageSize/)
  assert.match(upload, /checkRateLimit/)
  assert.match(upload, /export async function DELETE/)
  assert.match(upload, /path\.startsWith\(`\$\{userId\}\/`\)/)
})

test("material autosave uses a stable id and reports skipped writes", async () => {
  const [route, form] = await Promise.all([
    source("app/api/materials/autosave/route.ts"),
    source("components/media/material-cms-form.tsx"),
  ])

  assert.match(route, /id: payload\.id/)
  assert.match(route, /autosaveSlug\(fields\.title, payload\.id\)/)
  assert.match(route, /status: 409/)
  assert.match(form, /autosaveIdRef/)
  assert.match(form, /await persistDraft\(\)/)
})

test("material close flow is explicit and clears only its own backup", async () => {
  const [form, clearBackup] = await Promise.all([
    source("components/media/material-cms-form.tsx"),
    source("components/media/clear-material-autosave.tsx"),
  ])

  assert.match(form, /Сохранить изменения\?/)
  assert.match(form, /Сохранить черновик/)
  assert.match(form, /Не сохранять/)
  assert.doesNotMatch(clearBackup, /localStorage\.length/)
  assert.match(clearBackup, /removeItem\(storageKey\)/)
})

test("opening a notification does not mark it as read", async () => {
  const [list, bell] = await Promise.all([
    source("components/notifications/notification-list.tsx"),
    source("components/notifications/notification-bell.tsx"),
  ])

  assert.doesNotMatch(list, /NotificationOpenLink/)
  assert.doesNotMatch(bell, /NotificationOpenLink/)
  assert.match(bell, /NotificationReadButton/)
})

test("media embeds are allowed by CSP", async () => {
  const config = await source("next.config.ts")

  assert.match(config, /frame-src 'self'/)
  assert.match(config, /youtube-nocookie\.com/)
  assert.match(config, /player\.vimeo\.com/)
  assert.match(config, /rutube\.ru/)
})

test("favorite pinning has an atomic database path", async () => {
  const [route, sql] = await Promise.all([
    source("app/api/favorites/[id]/pin/route.ts"),
    source("supabase/sql/fix-favorites-pin-limit.sql"),
  ])

  assert.match(route, /\.rpc\("pin_favorite"/)
  assert.match(sql, /pg_advisory_xact_lock/)
  assert.match(sql, /favorite_pin_limit/)
  assert.match(sql, />= 4/)
})

test("in-memory rate limits evict expired and excessive keys", async () => {
  const [rateLimit, analytics] = await Promise.all([
    source("lib/security/rate-limit.ts"),
    source("app/api/analytics/events/route.ts"),
  ])

  assert.match(rateLimit, /sweepExpiredEntries/)
  assert.match(rateLimit, /maxEntries/)
  assert.match(analytics, /getRequestIdentifier\(request\.headers\)/)
  assert.doesNotMatch(analytics, /visitorKey \|\| request\.headers/)
})
