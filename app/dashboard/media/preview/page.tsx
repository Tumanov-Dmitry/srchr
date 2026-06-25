import { MaterialPreviewPageClient } from "@/components/media/material-preview-page-client"

export default async function DashboardMediaPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const { key } = await searchParams

  return (
    <div className="space-y-6">
      <MaterialPreviewPageClient storageKey={key ?? "srchr:material-preview"} />
    </div>
  )
}
