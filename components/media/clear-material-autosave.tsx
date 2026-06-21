"use client"

import { useEffect } from "react"

export function ClearMaterialAutosave({ storageKey }: { storageKey: string }) {
  useEffect(() => {
    if (storageKey.startsWith("srchr:material:")) {
      window.localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  return null
}
