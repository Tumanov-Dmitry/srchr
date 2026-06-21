"use client"

import type { MaterialDocument } from "@/lib/material-content"

function plain(value: unknown) {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, "") : ""
}

export function MaterialPreview({ document }: { document: MaterialDocument }) {
  return (
    <div className="space-y-6">
      {document.blocks.map((block, index) => {
        const key = block.id ?? `${block.type}-${index}`
        if (block.type === "section") {
          return (
            <h2 className="border-b pb-3 text-2xl font-semibold" key={key}>
              {plain(block.data.title)}
            </h2>
          )
        }
        if (block.type === "header") {
          return (
            <h3 className="text-xl font-semibold" key={key}>
              {plain(block.data.text)}
            </h3>
          )
        }
        if (block.type === "metric") {
          return (
            <div className="rounded-lg bg-muted p-5" key={key}>
              <strong className="text-3xl">{plain(block.data.value)}</strong>
              <p>{plain(block.data.label)}</p>
            </div>
          )
        }
        if (block.type === "image") {
          const file = block.data.file as { url?: string } | undefined
          return file?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="w-full rounded-lg"
              key={key}
              src={file.url}
            />
          ) : null
        }
        if (block.type === "gallery" && Array.isArray(block.data.images)) {
          return (
            <div className="grid gap-3 sm:grid-cols-2" key={key}>
              {block.data.images.map((url) =>
                typeof url === "string" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="aspect-video w-full rounded-lg object-cover"
                    key={url}
                    src={url}
                  />
                ) : null,
              )}
            </div>
          )
        }
        const content = plain(
          block.data.text ?? block.data.title ?? block.data.label,
        )
        return content ? (
          <p className="whitespace-pre-line leading-7" key={key}>
            {content}
          </p>
        ) : null
      })}
    </div>
  )
}
