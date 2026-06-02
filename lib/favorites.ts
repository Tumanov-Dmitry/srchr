import type { SupabaseClient } from "@supabase/supabase-js"
import type { Favorite, FavoriteSnapshot, FavoriteTargetType } from "@/types"

export const favoriteTargetTypes = [
  "company",
  "expert",
  "case",
  "article",
] as const

export const favoriteTypeLabels: Record<FavoriteTargetType, string> = {
  company: "Подрядчик",
  expert: "Эксперт",
  case: "Кейс",
  article: "Статья",
}

export const favoritePluralTypeMap = {
  all: null,
  companies: "company",
  experts: "expert",
  cases: "case",
  articles: "article",
} as const satisfies Record<string, FavoriteTargetType | null>

export type FavoriteTypeFilter = keyof typeof favoritePluralTypeMap

export function isFavoriteTargetType(
  value: unknown,
): value is FavoriteTargetType {
  return (
    typeof value === "string" &&
    favoriteTargetTypes.includes(value as FavoriteTargetType)
  )
}

export function normalizeFavoriteTypeFilter(
  value?: string | null,
): FavoriteTypeFilter {
  return value && value in favoritePluralTypeMap
    ? (value as FavoriteTypeFilter)
    : "all"
}

export function getFavoriteTargetPath(
  targetType: FavoriteTargetType,
  slug?: string | null,
) {
  if (!slug) return null

  if (targetType === "company") return `/contractors/${slug}`
  if (targetType === "expert") return `/@${slug}`

  return `/media/${slug}`
}

function textFrom(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined
}

type SnapshotResult = {
  snapshot: FavoriteSnapshot
  status: "active" | "unavailable"
  href: string | null
}

export async function buildFavoriteSnapshot(
  supabase: SupabaseClient,
  targetType: FavoriteTargetType,
  targetId: string,
): Promise<SnapshotResult | null> {
  if (targetType === "company") {
    const { data } = await supabase
      .from("organizations")
      .select(
        "id, slug, name, description, logo_url, city, status, is_contractor",
      )
      .eq("id", targetId)
      .maybeSingle()

    if (!data) return null

    const status =
      data.status === "published" && data.is_contractor
        ? "active"
        : "unavailable"
    return {
      status,
      href:
        status === "active"
          ? getFavoriteTargetPath(targetType, data.slug)
          : null,
      snapshot: {
        title: data.name,
        subtitle: textFrom(data.city),
        image: textFrom(data.logo_url),
        description: textFrom(data.description),
        object_type: targetType,
      },
    }
  }

  if (targetType === "expert") {
    const { data } = await supabase
      .from("expert_profiles")
      .select(
        "id, slug, avatar_url, first_name, last_name, position, short_description, is_public, status",
      )
      .eq("id", targetId)
      .maybeSingle()

    if (!data) return null

    const title = [data.first_name, data.last_name].filter(Boolean).join(" ")
    const status =
      data.is_public && data.status === "published" ? "active" : "unavailable"
    return {
      status,
      href:
        status === "active"
          ? getFavoriteTargetPath(targetType, data.slug)
          : null,
      snapshot: {
        title,
        subtitle: textFrom(data.position),
        image: textFrom(data.avatar_url),
        description: textFrom(data.short_description),
        object_type: targetType,
      },
    }
  }

  const { data } = await supabase
    .from("materials")
    .select("id, type, slug, title, description, cover_url, category, status")
    .eq("id", targetId)
    .eq("type", targetType)
    .maybeSingle()

  if (!data) return null

  const status = data.status === "published" ? "active" : "unavailable"
  return {
    status,
    href:
      status === "active" ? getFavoriteTargetPath(targetType, data.slug) : null,
    snapshot: {
      title: data.title,
      subtitle: textFrom(data.category),
      image: textFrom(data.cover_url),
      description: textFrom(data.description),
      object_type: targetType,
    },
  }
}

export async function hydrateFavorites(
  supabase: SupabaseClient,
  favorites: Favorite[],
): Promise<Favorite[]> {
  const hydrated = await Promise.all(
    favorites.map(async (favorite) => {
      const live = await buildFavoriteSnapshot(
        supabase,
        favorite.target_type,
        favorite.target_id,
      )

      if (!live) {
        if (favorite.status !== "unavailable") {
          await supabase
            .from("favorites")
            .update({
              status: "unavailable",
              updated_at: new Date().toISOString(),
            })
            .eq("id", favorite.id)
        }

        return {
          ...favorite,
          status: "unavailable" as const,
          href: null,
        }
      }

      if (favorite.status !== live.status) {
        await supabase
          .from("favorites")
          .update({ status: live.status, updated_at: new Date().toISOString() })
          .eq("id", favorite.id)
      }

      return {
        ...favorite,
        status: live.status,
        href: live.href,
        snapshot: favorite.snapshot?.title ? favorite.snapshot : live.snapshot,
      }
    }),
  )

  return hydrated
}
