import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const sql = await readFile(
  new URL("../../supabase/sql/extend-favorites-and-onboarding.sql", import.meta.url),
  "utf8",
)
const favoriteApi = await readFile(
  new URL("../../app/api/favorite-collections/route.ts", import.meta.url),
  "utf8",
)
const onboarding = await readFile(
  new URL("../../app/actions/onboarding.ts", import.meta.url),
  "utf8",
)
const onboardingForm = await readFile(
  new URL(
    "../../components/onboarding/onboarding-form.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("favorite collections are additive, private, and keep favorites intact", () => {
  assert.match(sql, /create table if not exists public\.favorite_collections/)
  assert.match(sql, /create table if not exists public\.favorite_collection_items/)
  assert.match(sql, /alter table public\.favorite_collections enable row level security/)
  assert.match(sql, /user_id = \(select auth\.uid\(\)\)/)
  assert.doesNotMatch(sql, /delete from public\.favorites/i)
  assert.doesNotMatch(favoriteApi, /createAdminClient/)
})

test("onboarding creates an expert before optional organization work", () => {
  const expertIndex = onboarding.indexOf("await createExpertProfile")
  const organizationIndex = onboarding.indexOf("organizationAction")

  assert.ok(expertIndex >= 0)
  assert.ok(organizationIndex > expertIndex)
  assert.match(onboarding, /marketRole/)
  assert.match(onboardingForm, /name="intent"/)
  assert.match(onboardingForm, /value="skip"/)
})

test("organization join requests are user scoped and owner reviewed", () => {
  assert.match(sql, /create table if not exists public\.organization_join_requests/)
  assert.match(sql, /Users create organization join requests/)
  assert.match(sql, /Organization owners manage join requests/)
  assert.match(sql, /private\.is_org_member/)
})
