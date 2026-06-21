import sanitizeHtml from "sanitize-html"

import type { MaterialDocument } from "@/lib/material-content"

function safe(value: unknown) {
  if (typeof value !== "string") return ""
  return sanitizeHtml(value, {
    allowedTags: [
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "mark",
      "code",
      "a",
      "br",
      "ul",
      "ol",
      "li",
    ],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  })
}

function safeUrl(value: unknown) {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

function safeEmbedUrl(value: unknown) {
  const url = safeUrl(value)
  if (!url) return null
  const hostname = new URL(url).hostname.replace(/^www\./, "")
  return [
    "youtube.com",
    "youtube-nocookie.com",
    "youtu.be",
    "vimeo.com",
    "rutube.ru",
  ].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
    ? url
    : null
}

export function MaterialContentRenderer({
  document,
}: {
  document: MaterialDocument
}) {
  return (
    <div className="space-y-7">
      {document.blocks.map((block, index) => {
        const key = block.id ?? `${block.type}-${index}`
        if (block.type === "section")
          return (
            <h2 className="border-b pb-4 pt-8 text-2xl font-semibold" key={key}>
              {String(block.data.title ?? "Раздел")}
            </h2>
          )
        if (block.type === "header") {
          const level = Number(block.data.level ?? 2)
          return level === 3 ? (
            <h3
              className="text-xl font-semibold"
              dangerouslySetInnerHTML={{ __html: safe(block.data.text) }}
              key={key}
            />
          ) : (
            <h2
              className="text-2xl font-semibold"
              dangerouslySetInnerHTML={{ __html: safe(block.data.text) }}
              key={key}
            />
          )
        }
        if (block.type === "paragraph")
          return (
            <div
              className="text-[1.05rem] leading-8 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: safe(block.data.text) }}
              key={key}
            />
          )
        if (block.type === "list") {
          const items = Array.isArray(block.data.items) ? block.data.items : []
          const List = block.data.style === "ordered" ? "ol" : "ul"
          return (
            <List
              className={
                List === "ol"
                  ? "list-decimal space-y-2 pl-6"
                  : "list-disc space-y-2 pl-6"
              }
              key={key}
            >
              {items.map((item, itemIndex) => {
                const content =
                  typeof item === "string"
                    ? item
                    : typeof item === "object" && item
                      ? (item as Record<string, unknown>).content
                      : ""
                return (
                  <li
                    dangerouslySetInnerHTML={{ __html: safe(content) }}
                    key={`${key}-${itemIndex}`}
                  />
                )
              })}
            </List>
          )
        }
        if (block.type === "quote")
          return (
            <blockquote
              className="border-l-4 border-primary pl-5 text-xl italic leading-8"
              key={key}
            >
              <span
                dangerouslySetInnerHTML={{ __html: safe(block.data.text) }}
              />
              {block.data.caption ? (
                <footer className="mt-2 text-sm not-italic text-muted-foreground">
                  {String(block.data.caption)}
                </footer>
              ) : null}
            </blockquote>
          )
        if (block.type === "delimiter")
          return <hr className="my-10 border-border" key={key} />
        if (block.type === "callout")
          return (
            <aside
              className="rounded-lg border-l-4 border-primary bg-primary/5 p-5 leading-7"
              dangerouslySetInnerHTML={{ __html: safe(block.data.text) }}
              key={key}
            />
          )
        if (block.type === "metric")
          return (
            <div className="rounded-lg bg-muted p-6 text-center" key={key}>
              <p className="text-4xl font-semibold text-primary">
                {String(block.data.value ?? "")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {String(block.data.label ?? "")}
              </p>
            </div>
          )
        if (block.type === "image") {
          const file = block.data.file as { url?: string } | undefined
          const imageUrl = safeUrl(file?.url)
          return imageUrl ? (
            <figure key={key}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={String(block.data.caption ?? "")}
                className="w-full rounded-lg"
                src={imageUrl}
              />
              {block.data.caption ? (
                <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                  {String(block.data.caption)}
                </figcaption>
              ) : null}
            </figure>
          ) : null
        }
        if (block.type === "gallery") {
          const images = Array.isArray(block.data.images)
            ? block.data.images
                .map(safeUrl)
                .filter((item): item is string => Boolean(item))
            : []
          return (
            <div className="grid gap-3 sm:grid-cols-2" key={key}>
              {images.map((url) => (
                <div
                  className="aspect-video overflow-hidden rounded-lg bg-muted"
                  key={url}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={url}
                  />
                </div>
              ))}
            </div>
          )
        }
        if (block.type === "embed") {
          const source = safeEmbedUrl(block.data.embed ?? block.data.source)
          return source ? (
            <div
              className="aspect-video overflow-hidden rounded-lg bg-muted"
              key={key}
            >
              <iframe
                allowFullScreen
                className="h-full w-full"
                src={source}
                title={String(block.data.caption ?? "Видео")}
              />
            </div>
          ) : null
        }
        if (block.type === "linkCard") {
          const url = safeUrl(block.data.url)
          return url ? (
            <a
              className="block rounded-lg border p-5 font-medium transition-colors hover:border-primary/40"
              href={url}
              key={key}
              rel="noopener noreferrer"
              target="_blank"
            >
              {String(block.data.title ?? url)}
            </a>
          ) : null
        }
        if (block.type === "button") {
          const url = safeUrl(block.data.url)
          return url ? (
            <p key={key}>
              <a
                className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                href={url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {String(block.data.label ?? "Открыть")}
              </a>
            </p>
          ) : null
        }
        return null
      })}
    </div>
  )
}
