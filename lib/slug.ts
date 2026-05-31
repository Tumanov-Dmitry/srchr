const translitMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
}

export function createSlug(value: string) {
  const source = extractHostname(value) ?? value
  const transliterated = source
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => translitMap[char] ?? char)
    .join("")

  return (
    transliterated
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "contractor"
  )
}

function extractHostname(value: string) {
  const trimmed = value.trim()

  if (!trimmed.includes(".") && !trimmed.includes("://")) return null

  try {
    const url = new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    )

    return url.hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}
