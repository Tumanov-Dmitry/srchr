import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    (owners[0] ? `${owners[0].owner_type}:${owners[0].owner_id}` : "")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Владелец материала</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <RequiredLabel htmlFor="owner" required>
          Публиковать от имени
        </RequiredLabel>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue={defaultOwner}
          id="owner"
          name="owner"
        >
          <option value="">Выберите владельца</option>
          {owners.map((owner) => (
            <option
              key={`${owner.owner_type}:${owner.owner_id}`}
              value={`${owner.owner_type}:${owner.owner_id}`}
            >
              {owner.owner_type === "expert" ? "Эксперт" : "Организация"}:{" "}
              {owner.label}
            </option>
          ))}
        </select>
      </CardContent>
    </Card>
  )
}
