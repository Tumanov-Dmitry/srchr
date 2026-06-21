import { reportServerError } from "@/lib/security/errors"
import { createClient } from "@/lib/supabase/server"
import type {
  MaterialEngagementState,
  MaterialReactionKey,
} from "@/lib/material-engagement"

function missingTable(error: { code?: string; message?: string } | null) {
  return Boolean(
    error?.code === "42P01" ||
    error?.message?.includes("Could not find the table") ||
    error?.message?.includes("does not exist"),
  )
}

export async function getMaterialEngagement(
  materialId: string,
): Promise<MaterialEngagementState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [commentsResult, reactionsResult] = await Promise.all([
    supabase
      .from("material_comments")
      .select("id, body, user_id, created_at")
      .eq("material_id", materialId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("material_reactions")
      .select("user_id, reaction")
      .eq("material_id", materialId),
  ])

  if (
    missingTable(commentsResult.error) ||
    missingTable(reactionsResult.error)
  ) {
    return {
      comments: [],
      reactionCounts: {
        insightful: 0,
        useful: 0,
        wow: 0,
        love: 0,
        applause: 0,
      },
      currentReaction: null,
      isAuthenticated: Boolean(user),
      isAvailable: false,
    }
  }
  if (commentsResult.error)
    reportServerError("materials.comments", commentsResult.error)
  if (reactionsResult.error)
    reportServerError("materials.reactions", reactionsResult.error)

  const userIds = [
    ...new Set(
      (commentsResult.data ?? []).map((item) => item.user_id as string),
    ),
  ]
  const profilesResult = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, name, avatar_url")
        .in("id", userIds)
    : { data: [], error: null }
  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.id as string,
      profile,
    ]),
  )
  const reactionCounts: MaterialEngagementState["reactionCounts"] = {
    insightful: 0,
    useful: 0,
    wow: 0,
    love: 0,
    applause: 0,
  }
  let currentReaction: MaterialReactionKey | null = null

  for (const row of reactionsResult.data ?? []) {
    const reaction = row.reaction as MaterialReactionKey
    if (reaction in reactionCounts) reactionCounts[reaction] += 1
    if (user && row.user_id === user.id) currentReaction = reaction
  }

  return {
    comments: (commentsResult.data ?? []).map((comment) => {
      const profile = profiles.get(comment.user_id as string) as
        | {
            full_name?: string | null
            name?: string | null
            avatar_url?: string | null
          }
        | undefined
      return {
        id: comment.id as string,
        body: comment.body as string,
        created_at: comment.created_at as string,
        author: {
          name: profile?.full_name ?? profile?.name ?? "Пользователь SRCHR",
          avatar_url: profile?.avatar_url ?? null,
        },
      }
    }),
    reactionCounts,
    currentReaction,
    isAuthenticated: Boolean(user),
    isAvailable: true,
  }
}
