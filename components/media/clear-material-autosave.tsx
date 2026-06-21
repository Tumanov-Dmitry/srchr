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
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index)
      if (key?.startsWith("srchr:material:v2:")) {
        window.localStorage.removeItem(key)
      }
    }
  }, [])

  return null
}
