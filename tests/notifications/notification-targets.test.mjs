import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = await readFile(
  new URL("../../lib/notification-targets.ts", import.meta.url),
  "utf8",
)

test("material notifications resolve current slug before stored URL", () => {
  const materialBranch = source.slice(
    source.indexOf('targetType === "case"'),
    source.indexOf("return {", source.indexOf('targetType === "case"') + 200),
  )

  assert.match(source, /material\?\.slug && material\.status === "published"/)
  assert.match(source, /`\/media\/\$\{material\.slug\}`/)
  assert.ok(
    source.indexOf('targetType === "case"') <
      source.lastIndexOf("normalizedUrl ??"),
  )
  assert.ok(materialBranch.length > 0)
})

test("unpublished materials open their dashboard editor", () => {
  assert.match(source, /`\/dashboard\/media\/\$\{targetId\}\/edit`/)
})

test("legacy notifications can recover target type and UUID", () => {
  assert.match(source, /notification\.target_type \?\? notification\.type/)
  assert.match(source, /url\.searchParams\.get\("target"\)/)
  assert.match(source, /\[0-9a-f\]\{8\}/)
})
