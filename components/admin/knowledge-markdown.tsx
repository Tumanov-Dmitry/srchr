import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

function headingId(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
}

function renderInline(value: string): ReactNode[] {
  const parts = value.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g)

  return parts.map((part, index) => {
    const code = /^`([^`]+)`$/.exec(part)
    if (code) {
      return (
        <code
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em]"
          key={`${part}-${index}`}
        >
          {code[1]}
        </code>
      )
    }

    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (link) {
      return (
        <a
          className="font-medium text-primary underline-offset-4 hover:underline"
          href={link[2]}
          key={`${part}-${index}`}
        >
          {link[1]}
        </a>
      )
    }

    return part
  })
}

export function KnowledgeMarkdown({ content }: { content: string }) {
  const lines = content.split(/\r?\n/)
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim()
      const codeLines: string[] = []
      index += 1

      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index])
        index += 1
      }

      index += 1
      blocks.push(
        <pre
          className="overflow-x-auto rounded-xl border bg-foreground p-4 text-sm text-background"
          key={`code-${index}`}
        >
          <code data-language={language || undefined}>
            {codeLines.join("\n")}
          </code>
        </pre>,
      )
      continue
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    if (heading) {
      const depth = heading[1].length
      const title = heading[2]
      const Tag = `h${depth}` as "h1" | "h2" | "h3"

      blocks.push(
        <Tag
          className={cn(
            "scroll-mt-24 text-foreground",
            depth === 1 && "type-h2",
            depth === 2 && "type-h3 mt-10 border-t pt-8",
            depth === 3 && "mt-7 text-lg font-semibold",
          )}
          id={headingId(title)}
          key={`heading-${index}`}
        >
          {title}
        </Tag>,
      )
      index += 1
      continue
    }

    if (/^-\s+/.test(line)) {
      const items: string[] = []

      while (index < lines.length && /^-\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^-\s+/, ""))
        index += 1
      }

      blocks.push(
        <ul
          className="ml-5 list-disc space-y-2 text-muted-foreground"
          key={`list-${index}`}
        >
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []

      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ""))
        index += 1
      }

      blocks.push(
        <ol
          className="ml-5 list-decimal space-y-2 text-muted-foreground"
          key={`list-${index}`}
        >
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>
          ))}
        </ol>,
      )
      continue
    }

    const paragraph: string[] = [line]
    index += 1

    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^-\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index]) &&
      !lines[index].startsWith("```")
    ) {
      paragraph.push(lines[index])
      index += 1
    }

    blocks.push(
      <p className="leading-7 text-muted-foreground" key={`paragraph-${index}`}>
        {renderInline(paragraph.join(" "))}
      </p>,
    )
  }

  return <article className="space-y-5">{blocks}</article>
}
