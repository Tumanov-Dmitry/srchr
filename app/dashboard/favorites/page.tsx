import { redirect } from "next/navigation"

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams

  redirect(params.type ? `/favorites?type=${params.type}` : "/favorites")
}
