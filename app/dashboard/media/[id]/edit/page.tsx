import { notFound, redirect } from "next/navigation"

import { updateMaterial } from "@/app/actions/media"
import { MaterialCmsForm } from "@/components/media/material-cms-form"
import { parseMaterialDocument } from "@/lib/material-content"
import { decodeMessage } from "@/lib/messages"
import { getDashboardMaterialById, getServices } from "@/lib/supabase/queries"

export default async function EditMaterialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ message?: string }>
}) {
  const { id } = await params
  const [{ message: rawMessage }, materialState, services] = await Promise.all([
    searchParams,
    getDashboardMaterialById(id),
    getServices(),
  ])

  if (!materialState.user) redirect("/login")
  if (materialState.isMaterialsTableMissing) redirect("/dashboard/media")
  if (!materialState.material) notFound()

  return (
    <MaterialCmsForm
      action={updateMaterial}
      initialDocument={parseMaterialDocument(materialState.material)}
      material={materialState.material}
      message={decodeMessage(rawMessage)}
      owners={materialState.owners}
      services={services}
      type={materialState.material.type}
    />
  )
}
