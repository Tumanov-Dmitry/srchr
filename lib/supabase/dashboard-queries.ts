import { createClient } from "@/lib/supabase/server"

export async function getTenderResponseCounts(tenderIds: string[]) {
  if (tenderIds.length === 0) return {} as Record<string, number>

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tender_responses")
    .select("tender_id")
    .in("tender_id", tenderIds)

  if (error) return {} as Record<string, number>

  return (data ?? []).reduce<Record<string, number>>((counts, row) => {
    if (row.tender_id) {
      counts[row.tender_id] = (counts[row.tender_id] ?? 0) + 1
    }
    return counts
  }, {})
}
