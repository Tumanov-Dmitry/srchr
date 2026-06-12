import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const componentLabRoute = await readFile(
  new URL("../../app/dev/ui/page.tsx", import.meta.url),
  "utf8",
)

test("component lab requires an authenticated administrator", () => {
  assert.match(componentLabRoute, /getAdminAccess/)
  assert.match(componentLabRoute, /if \(!access\.user\)/)
  assert.match(componentLabRoute, /if \(!access\.isAdmin\)/)
  assert.match(componentLabRoute, /redirect\("\/dashboard"\)/)
})
