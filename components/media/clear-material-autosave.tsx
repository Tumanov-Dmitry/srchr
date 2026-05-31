"use client"

import { useEffect } from "react"

const materialDraftKeys = [
  "srchr:material:article:draft",
  "srchr:material:case:draft",
]

export function ClearMaterialAutosave() {
  useEffect(() => {
    for (const key of materialDraftKeys) {
      window.localStorage.removeItem(key)
    }
  }, [])

  return null
}
