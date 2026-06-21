import { redirect } from "next/navigation"

import { createCaseMaterial } from "@/app/actions/media"
import { CaseMaterialWizard } from "@/components/media/case-material-wizard"
import { createEmptyMaterialDocument } from "@/lib/material-content"
import { decodeMessage } from "@/lib/messages"
import {
  getMaterialClientOptions,
  getServices,
  getUserContentOwners,
} from "@/lib/supabase/queries"

export default async function NewCaseMaterialPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const [{ message: rawMessage }, { user, owners }, services, clients] =
    await Promise.all([
      searchParams,
      getUserContentOwners(),
      getServices(),
      getMaterialClientOptions(),
    ])
  if (!user) redirect("/login")

  return (
    <CaseMaterialWizard
      action={createCaseMaterial}
      clients={clients}
      initialDocument={createEmptyMaterialDocument("case")}
      message={decodeMessage(rawMessage)}
      owners={owners}
      services={services}
    />
  )
}
