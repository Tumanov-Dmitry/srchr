"use client"

import { useRef } from "react"

import { MaterialBlockEditor } from "@/components/media/material-block-editor"
import type { MaterialBlock, MaterialDocument } from "@/lib/material-content"

type CaseSectionEditorProps = {
  id: string
  value: string
  onChange: (value: string) => void
}

function htmlToDocument(value: string): MaterialDocument {
  return {
    version: 2,
    type: "case",
    blocks: [{ type: "paragraph", data: { text: value } }],
    meta: {},
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : ""
}

function listItems(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === "string") return item
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>
        return stringValue(row.content ?? row.text)
      }
      return ""
    })
    .filter(Boolean)
}

function blocksToHtml(blocks: MaterialBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "header") {
        const level = Number(block.data.level ?? 2) === 3 ? 3 : 2
        return `<h${level}>${stringValue(block.data.text)}</h${level}>`
      }
      if (block.type === "list") {
        const tag = block.data.style === "ordered" ? "ol" : "ul"
        const items = listItems(block.data.items)
          .map((item) => `<li>${item}</li>`)
          .join("")
        return items ? `<${tag}>${items}</${tag}>` : ""
      }
      if (block.type === "quote") {
        return `<blockquote>${stringValue(block.data.text)}</blockquote>`
      }
      if (block.type === "delimiter") return "<hr>"
      if (block.type === "image") {
        const file = block.data.file as { url?: unknown } | undefined
        const url = stringValue(file?.url)
        const caption = stringValue(block.data.caption)
        return url
          ? `<figure><img src="${url}" alt="${caption}">${
              caption ? `<figcaption>${caption}</figcaption>` : ""
            }</figure>`
          : ""
      }
      if (block.type === "paragraph") return stringValue(block.data.text)
      return stringValue(block.data.text ?? block.data.title ?? block.data.label)
    })
    .filter(Boolean)
    .join("\n")
}

export function CaseSectionEditor({
  id,
  value,
  onChange,
}: CaseSectionEditorProps) {
  const initialDocumentRef = useRef<MaterialDocument | null>(null)
  initialDocumentRef.current ??= htmlToDocument(value)

  return (
    <div id={id}>
      <MaterialBlockEditor
        document={initialDocumentRef.current}
        onChange={(nextDocument) => onChange(blocksToHtml(nextDocument.blocks))}
      />
    </div>
  )
}
