import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Material, Organization, Tender } from "@/types"

export type AdminProfile = {
  id: string
  email?: string | null
  full_name?: string | null
  name?: string | null
  role?: string | null
  account_type?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  last_seen_at?: string | null
  organizations?: Organization | null
}

type ProfileRow = {
  id: string
  full_name?: string | null
  account_type?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type AdminStats = {
  agencies: number
  clients: number
  specialists: number
  publishedCases: number
  publishedArticles: number
  moderationMaterials: number
  activeTenders: number
  tenderResponses: number
  subscriptions: number
  requests: number
}

export type AdminAccess = {
  isAdmin: boolean
  user: { id: string; email?: string | null } | null
  profile: AdminProfile | null
}

export async function getAdminAccess(): Promise<AdminAccess> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isAdmin: false, user: null, profile: null }
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  const profile = (data ?? null) as AdminProfile | null
  const role = profile?.role ?? profile?.account_type ?? user.app_metadata?.role

  return {
    isAdmin: role === "admin" || role === "super_admin" || role === "moderator",
    user: { id: user.id, email: user.email },
    profile,
  }
}

function isMissingRelation(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? ""
  return (
    error?.code === "42P01" ||
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  )
}

async function countRows(
  table: string,
  filters: Array<[string, string | number | boolean]> = [],
) {
  try {
    const supabase = createAdminClient()
    let query = supabase.from(table).select("id", {
      count: "exact",
      head: true,
    })

    for (const [column, filterValue] of filters) {
      query = query.eq(column, filterValue)
    }

    const { count, error } = await query
    if (error && !isMissingRelation(error)) return 0

    return count ?? 0
  } catch {
    return 0
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  const [
    agencies,
    clients,
    specialists,
    publishedCases,
    publishedArticles,
    moderationMaterials,
    activeTenders,
    tenderResponses,
    subscriptions,
    requests,
  ] = await Promise.all([
    countRows("organizations", [["is_contractor", true]]),
    countRows("organizations", [["is_client", true]]),
    countRows("contractor_profiles"),
    countRows("materials", [["type", "case"], ["status", "published"]]),
    countRows("materials", [["type", "article"], ["status", "published"]]),
    countRows("materials", [["status", "moderation"]]),
    countRows("tenders", [["status", "published"]]),
    countRows("tender_responses"),
    countRows("subscriptions", [["status", "active"]]),
    countRows("analytics_events", [["event_type", "request"]]),
  ])

  return {
    agencies,
    clients,
    specialists,
    publishedCases,
    publishedArticles,
    moderationMaterials,
    activeTenders,
    tenderResponses,
    subscriptions,
    requests,
  }
}

export async function getAdminProfiles() {
  const supabase = createAdminClient()
  const [{ data: usersData }, { data: profilesData, error: profilesError }] =
    await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 100 }),
      supabase
        .from("profiles")
        .select("id, full_name, account_type, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(500),
    ])

  const profiles = profilesError ? [] : ((profilesData ?? []) as ProfileRow[])
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  const users = usersData.users ?? []

  if (users.length > 0) {
    return users.map((user) => {
      const profile = profilesById.get(user.id)

      return {
        id: user.id,
        email: user.email ?? null,
        full_name: profile?.full_name ?? null,
        name: null,
        role: null,
        status: null,
        account_type: profile?.account_type ?? "guest",
        created_at: profile?.created_at ?? user.created_at ?? null,
        updated_at: profile?.updated_at ?? user.updated_at ?? null,
        last_seen_at: user.last_sign_in_at ?? null,
      } satisfies AdminProfile
    })
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, account_type, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(100)

  return error ? [] : ((data ?? []) as AdminProfile[])
}

export async function getAdminOrganizations() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("organizations")
    .select("*, organization_members(*), organization_services(services(*)), subscriptions(*)")
    .order("created_at", { ascending: false })
    .limit(100)

  return error ? [] : ((data ?? []) as Organization[])
}

export async function getAdminMaterials(type?: "case" | "article") {
  const supabase = createAdminClient()
  let query = supabase
    .from("materials")
    .select("*, organizations:organization_id(*)")
    .order("created_at", { ascending: false })
    .limit(100)

  if (type) {
    query = query.eq("type", type)
  }

  const { data, error } = await query
  return error ? [] : ((data ?? []) as Material[])
}

export async function getAdminTenders() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("tenders")
    .select("*, organizations(*)")
    .order("created_at", { ascending: false })
    .limit(100)

  return error ? [] : ((data ?? []) as Tender[])
}
