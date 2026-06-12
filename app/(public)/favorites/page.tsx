import { redirect } from "next/navigation"

export default async function PublicFavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams
  redirect(
    params.type
      ? `/dashboard/favorites?type=${params.type}`
      : "/dashboard/favorites",
  )
}
