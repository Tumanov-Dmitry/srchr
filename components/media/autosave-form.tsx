"use client"

import { useEffect, useRef } from "react"

type AutosaveFormProps = React.ComponentProps<"form"> & {
  storageKey: string
}

export function AutosaveForm({
  storageKey,
  children,
  ...props
}: AutosaveFormProps) {
  const formRef = useRef<HTMLFormElement>(null)

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
    }

    form.addEventListener("input", save)
    form.addEventListener("change", save)

    return () => {
      form.removeEventListener("input", save)
      form.removeEventListener("change", save)
    }
  }, [storageKey])

  return (
    <form ref={formRef} {...props}>
      {children}
    </form>
  )
}
