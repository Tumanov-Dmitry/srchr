import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const read = (path) => readFileSync(path, "utf8")

test("case editor uses a fixed three-step workflow", () => {
  const source = read("components/media/case-material-wizard.tsx")
  assert.match(source, /О проекте.*Задача и решение.*Результат и команда/s)
  assert.match(source, /getMissingCaseWizardFields/)
  assert.match(source, /Сохранить черновик/)
  assert.match(source, /На модерацию/)
})

test("case short description is derived from project text", () => {
  const source = read("lib/material-case.ts")
  assert.match(source, /caseDescription\(projectAbout/)
  assert.match(source, /slice\(0, 237\)/)
})

test("material engagement is isolated and protected with RLS", () => {
  const sql = read("supabase/sql/create-material-engagement.sql")
  assert.match(
    sql,
    /alter table public\.material_comments enable row level security/i,
  )
  assert.match(
    sql,
    /alter table public\.material_reactions enable row level security/i,
  )
  assert.match(sql, /unique \(material_id, user_id\)/i)
  assert.match(sql, /materials\.status = 'published'/i)
  assert.match(sql, /user_id = \(select auth\.uid\(\)\)/i)
})

test("comments and reactions require an authenticated user", () => {
  for (const path of [
    "app/api/materials/[id]/comments/route.ts",
    "app/api/materials/[id]/reactions/route.ts",
  ]) {
    const source = read(path)
    assert.match(source, /supabase\.auth\.getUser\(\)/)
    assert.match(source, /status: 401/)
  }
})
