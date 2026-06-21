"use client"

import { useEffect, useRef } from "react"
import type EditorJS from "@editorjs/editorjs"
import type { OutputData } from "@editorjs/editorjs"

import {
  ButtonTool,
  CalloutTool,
  DuplicateTune,
  GalleryTool,
  LinkCardTool,
  MetricTool,
  SectionTool,
} from "@/components/media/editor-block-tools"
import type { MaterialDocument } from "@/lib/material-content"

type MaterialBlockEditorProps = {
  document: MaterialDocument
  onChange: (document: MaterialDocument) => void
}

export function MaterialBlockEditor({
  document,
  onChange,
}: MaterialBlockEditorProps) {
  const holderRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorJS | null>(null)
  const onChangeRef = useRef(onChange)
  const initialDocumentRef = useRef(document)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let active = true

    async function initialize() {
      if (!holderRef.current || editorRef.current) return
      const [
        { default: Editor },
        { default: Header },
        { default: List },
        { default: Quote },
        { default: Delimiter },
        { default: Embed },
        { default: ImageTool },
        dragDropModule,
      ] = await Promise.all([
        import("@editorjs/editorjs"),
        import("@editorjs/header"),
        import("@editorjs/list"),
        import("@editorjs/quote"),
        import("@editorjs/delimiter"),
        import("@editorjs/embed"),
        import("@editorjs/image"),
        import("editorjs-drag-drop"),
      ])

      if (!active || !holderRef.current) return

      const editor = new Editor({
        holder: holderRef.current,
        minHeight: 180,
        placeholder: "Нажмите Tab или +, чтобы добавить блок",
        inlineToolbar: true,
        data: {
          time: initialDocumentRef.current.time,
          blocks: initialDocumentRef.current.blocks,
          version: "2",
        },
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: { levels: [2, 3], defaultLevel: 2 },
          },
          list: { class: List, inlineToolbar: true },
          quote: { class: Quote, inlineToolbar: true },
          delimiter: Delimiter,
          embed: Embed,
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const body = new FormData()
                  body.append("image", file)
                  const response = await fetch("/api/materials/upload", {
                    method: "POST",
                    body,
                  })
                  return response.json()
                },
                async uploadByUrl(url: string) {
                  return { success: 1, file: { url } }
                },
              },
            },
          },
          section: SectionTool,
          callout: CalloutTool,
          metric: MetricTool,
          gallery: GalleryTool,
          linkCard: LinkCardTool,
          button: ButtonTool,
          duplicateTune: { class: DuplicateTune },
        },
        tunes: ["duplicateTune"],
        onReady() {
          const DragDrop = (
            dragDropModule as { default?: new (editor: EditorJS) => unknown }
          ).default
          if (DragDrop) new DragDrop(editor)
        },
        async onChange() {
          const output = (await editor.save()) as OutputData
          onChangeRef.current({
            ...initialDocumentRef.current,
            time: output.time,
            blocks: output.blocks.map((block) => ({
              id: block.id,
              type: block.type,
              data: block.data,
            })),
          })
        },
        i18n: {
          messages: {
            ui: {
              blockTunes: { toggler: { "Click to tune": "Настройки блока" } },
              inlineToolbar: { converter: { "Convert to": "Преобразовать" } },
              toolbar: { toolbox: { Add: "Добавить" } },
            },
            toolNames: {
              Text: "Текст",
              Heading: "Заголовок",
              List: "Список",
              Quote: "Цитата",
              Delimiter: "Разделитель",
              Image: "Изображение",
              Embed: "Видео",
            },
          },
        },
      })
      editorRef.current = editor
    }

    void initialize()
    return () => {
      active = false
      const editor = editorRef.current
      editorRef.current = null
      if (editor && typeof editor.destroy === "function") editor.destroy()
    }
  }, [document.type])

  return (
    <div className="material-editor rounded-lg border bg-background px-3 py-4 sm:px-8">
      <div ref={holderRef} />
    </div>
  )
}
