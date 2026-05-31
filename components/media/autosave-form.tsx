"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

type AutosaveFormProps = React.ComponentProps<"form"> & {
  storageKey: string
}

export function AutosaveForm({
  storageKey,
  children,
  ...props
}: AutosaveFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const isSubmittingRef = useRef(false)
  const [hasLocalDraft, setHasLocalDraft] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    const form = formRef.current
    if (!form) return

    const saved = window.localStorage.getItem(storageKey)
    if (saved) {
      try {
        const values = JSON.parse(saved) as Record<string, string>

        for (const [name, value] of Object.entries(values)) {
          const fields = form.elements.namedItem(name)
          const field = Array.isArray(fields) ? fields[0] : fields

          if (
            field instanceof HTMLInputElement ||
            field instanceof HTMLTextAreaElement ||
            field instanceof HTMLSelectElement
          ) {
            field.value = value
          }
        }

        setHasLocalDraft(true)
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }

    const save = () => {
      const values: Record<string, string> = {}
      const formData = new FormData(form)

      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") {
          values[key] = value
        }
      }

      window.localStorage.setItem(storageKey, JSON.stringify(values))
      setHasLocalDraft(true)
      setIsDirty(true)
    }

    const markSubmitting = () => {
      isSubmittingRef.current = true
    }

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if ((!isDirty && !hasLocalDraft) || isSubmittingRef.current) return

      event.preventDefault()
      event.returnValue = ""
    }

    form.addEventListener("input", save)
    form.addEventListener("change", save)
    form.addEventListener("submit", markSubmitting)
    window.addEventListener("beforeunload", warnBeforeUnload)

    return () => {
      form.removeEventListener("input", save)
      form.removeEventListener("change", save)
      form.removeEventListener("submit", markSubmitting)
      window.removeEventListener("beforeunload", warnBeforeUnload)
    }
  }, [hasLocalDraft, isDirty, storageKey])

  function discardLocalDraft() {
    const form = formRef.current

    window.localStorage.removeItem(storageKey)
    form?.reset()
    setHasLocalDraft(false)
    setIsDirty(false)
  }

  return (
    <form ref={formRef} {...props}>
      {hasLocalDraft || isDirty ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">
                Есть несохраненный текст
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Сохраните черновик или удалите локальный текст, если он больше не нужен.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button name="status" type="submit" value="draft" variant="outline">
                Сохранить черновик
              </Button>
              <Button onClick={discardLocalDraft} type="button" variant="destructive">
                Удалить текст
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </form>
  )
}
