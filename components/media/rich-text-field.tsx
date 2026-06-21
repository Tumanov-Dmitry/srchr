"use client"

import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type RichTextFieldProps = {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextField({
  id,
  value,
  onChange,
  placeholder,
  className,
}: RichTextFieldProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  function command(name: string, commandValue?: string) {
    editorRef.current?.focus()
    document.execCommand(name, false, commandValue)
    onChange(editorRef.current?.innerHTML ?? "")
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-background",
        className,
      )}
    >
      <div className="flex flex-wrap gap-1 border-b bg-muted/40 p-2">
        <Button
          aria-label="Жирный"
          onClick={() => command("bold")}
          size="sm"
          type="button"
          variant="ghost"
        >
          <strong>Ж</strong>
        </Button>
        <Button
          aria-label="Курсив"
          onClick={() => command("italic")}
          size="sm"
          type="button"
          variant="ghost"
        >
          <em>К</em>
        </Button>
        <Button
          onClick={() => command("insertUnorderedList")}
          size="sm"
          type="button"
          variant="ghost"
        >
          Список
        </Button>
        <Button
          onClick={() => {
            const url = window.prompt("Ссылка")
            if (url) command("createLink", url)
          }}
          size="sm"
          type="button"
          variant="ghost"
        >
          Ссылка
        </Button>
      </div>
      <div
        aria-label={placeholder}
        className="prose prose-sm min-h-36 max-w-none px-4 py-3 outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
        contentEditable
        data-placeholder={placeholder}
        id={id}
        onBlur={(event) => onChange(event.currentTarget.innerHTML)}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        ref={editorRef}
        role="textbox"
        suppressContentEditableWarning
      />
    </div>
  )
}
