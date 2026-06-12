import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormSelect } from "@/components/ui/form-select"
import { RequiredLabel } from "@/components/ui/required-label"
import type { ContentOwner, Material } from "@/types"

export function MaterialOwnerSelect({
  owners,
  material,
}: {
  owners: ContentOwner[]
  material?: Material | null
}) {
  const materialOwner =
    material?.owner_type === "expert" && material.expert_id
      ? `expert:${material.expert_id}`
      : material?.organization_id || material?.company_id
        ? `organization:${material.organization_id ?? material.company_id}`
        : null
  const defaultOwner =
    materialOwner ??
    (owners[0] ? `${owners[0].owner_type}:${owners[0].owner_id}` : undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Владелец материала</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <RequiredLabel htmlFor="owner" required>
          Публиковать от имени
        </RequiredLabel>
        <FormSelect
          defaultValue={defaultOwner}
          name="owner"
          options={owners.map((owner) => ({
            value: `${owner.owner_type}:${owner.owner_id}`,
            label: `${owner.owner_type === "expert" ? "Эксперт" : "Организация"}: ${owner.label}`,
          }))}
          placeholder="Выберите владельца"
        />
      </CardContent>
    </Card>
  )
}
