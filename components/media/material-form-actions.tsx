"use client"

import { Button } from "@/components/ui/button"

type MaterialFormActionsProps = {
  status?: string | null
}

export function MaterialFormActions({ status }: MaterialFormActionsProps) {
  const isDraft = (status ?? "draft") === "draft"

  function setAction(intent: "save" | "moderate" | "delete") {
    const form = document.querySelector<HTMLFormElement>("[data-material-form]")
    const statusInput = form?.elements.namedItem("status")
    const intentInput = form?.elements.namedItem("intent")

    if (statusInput instanceof HTMLInputElement) {
      statusInput.value = intent === "moderate" ? "moderation" : "draft"
    }

    if (intentInput instanceof HTMLInputElement) {
      intentInput.value = intent
    }
  }

  function confirmDelete(event: React.MouseEvent<HTMLButtonElement>) {
    if (!window.confirm("Удалить черновик? Это действие нельзя отменить.")) {
      event.preventDefault()
      return
    }

    setAction("delete")
  }

  return (
    <div className="flex flex-wrap gap-3">
      <input name="intent" type="hidden" value="save" />
      <input name="status" type="hidden" value={status ?? "draft"} />

      <Button onClick={() => setAction("save")} type="submit" variant="outline">
        Сохранить черновик
      </Button>
      <Button onClick={() => setAction("moderate")} type="submit">
        Отправить на модерацию
      </Button>
      {isDraft ? (
        <Button onClick={confirmDelete} type="submit" variant="destructive">
          Удалить черновик
        </Button>
      ) : null}
    </div>
  )
}
