import { redirect } from "next/navigation"

import { createArticleMaterial } from "@/app/actions/media"
import { MaterialCmsForm } from "@/components/media/material-cms-form"
import { createEmptyMaterialDocument } from "@/lib/material-content"
import { decodeMessage } from "@/lib/messages"
import { getServices, getUserContentOwners } from "@/lib/supabase/queries"

export default async function NewArticleMaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const [{ message: rawMessage }, { user, owners }, services] =
    await Promise.all([searchParams, getUserContentOwners(), getServices()])
  if (!user) redirect("/login")

  return (
    <MaterialCmsForm
      action={createArticleMaterial}
      initialDocument={createEmptyMaterialDocument("article")}
      message={decodeMessage(rawMessage)}
      owners={owners}
      services={services}
      type="article"
    />
  )
}
