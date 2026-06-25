import {
  deleteAdminDashboardStoryHighlight,
  saveAdminDashboardStoryHighlight,
} from "@/app/actions/admin"
import { DashboardStoriesEditor } from "@/components/admin/dashboard-stories-editor"
import { Alert } from "@/components/ui/alert"
import { decodeMessage } from "@/lib/messages"
import { getAdminDashboardStoryHighlights } from "@/lib/supabase/admin-queries"

export default async function AdminOnboardingStoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const [{ message: rawMessage }, highlights] = await Promise.all([
    searchParams,
    getAdminDashboardStoryHighlights(),
  ])
  const message = decodeMessage(rawMessage)

  return (
    <div className="space-y-6">
      {message ? <Alert>{message}</Alert> : null}
      <DashboardStoriesEditor
        deleteAction={deleteAdminDashboardStoryHighlight}
        highlights={highlights}
        saveAction={saveAdminDashboardStoryHighlight}
      />
    </div>
  )
}
