import { notFound, redirect } from "next/navigation"

import { updateMaterial } from "@/app/actions/media"
import { CaseMaterialWizard } from "@/components/media/case-material-wizard"
import { MaterialCmsForm } from "@/components/media/material-cms-form"
import { parseMaterialDocument } from "@/lib/material-content"
import { decodeMessage } from "@/lib/messages"
import {
  getDashboardMaterialById,
  getMaterialClientOptions,
  getServices,
} from "@/lib/supabase/queries"

export default async function EditMaterialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const { id } = await params
  const [{ message: rawMessage }, materialState, services, clients] =
    await Promise.all([
      searchParams,
      getDashboardMaterialById(id),
      getServices(),
      getMaterialClientOptions(),
    ])

  if (!materialState.user) redirect("/login")
  if (materialState.isMaterialsTableMissing) redirect("/dashboard/media")
  if (!materialState.material) notFound()

  return materialState.material.type === "case" ? (
    <CaseMaterialWizard
      action={updateMaterial}
      clients={clients}
      initialDocument={parseMaterialDocument(materialState.material)}
      material={materialState.material}
      message={decodeMessage(rawMessage)}
      owners={materialState.owners}
      services={services}
    />
  ) : (
    <MaterialCmsForm
      action={updateMaterial}
      initialDocument={parseMaterialDocument(materialState.material)}
      material={materialState.material}
      message={decodeMessage(rawMessage)}
      owners={materialState.owners}
      services={services}
      type="article"
    />
  )
}
