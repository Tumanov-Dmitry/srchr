import { redirect } from "next/navigation"

import { ComponentLab } from "@/components/dev/component-lab"
import { getAdminAccess } from "@/lib/supabase/admin-queries"

export default async function UiPlaygroundPage() {
  const access = await getAdminAccess()

  if (!access.user) {
    redirect("/login?next=/dev/ui")
  }

  if (!access.isAdmin) {
    redirect("/dashboard")
  }

  return <ComponentLab />
}
