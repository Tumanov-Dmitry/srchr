"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createNotification } from "@/lib/notifications"
import { reportServerError } from "@/lib/security/errors"
import { createClient } from "@/lib/supabase/server"

export async function reviewOrganizationJoinRequest(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const requestId = String(formData.get("request_id") ?? "")
  const decision = String(formData.get("decision") ?? "")
  if (!requestId || !["approved", "rejected"].includes(decision)) return

  const { data: joinRequest, error: requestError } = await supabase
    .from("organization_join_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle()

  if (requestError || !joinRequest) {
    redirect("/dashboard/organization?message=Запрос не найден")
  }

  try {
    if (decision === "approved") {
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: joinRequest.organization_id,
          user_id: joinRequest.user_id,
          role: joinRequest.requested_role ?? "member",
        })

      if (memberError && memberError.code !== "23505") {
        throw new Error(memberError.message)
      }
    }

    const { error: updateError } = await supabase
      .from("organization_join_requests")
      .update({
        status: decision,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (updateError) throw new Error(updateError.message)

    await createNotification({
      recipient_id: joinRequest.user_id,
      title:
        decision === "approved"
          ? "Доступ к организации одобрен"
          : "Запрос в организацию отклонён",
      type: "organization_join_request_status",
      target_type: "organization",
      target_id: joinRequest.organization_id,
      target_url: "/dashboard/organization",
    })
  } catch (error) {
    reportServerError("organization.reviewJoinRequest", error)
    redirect("/dashboard/organization?message=Не удалось обработать запрос")
  }

  revalidatePath("/dashboard/organization")
  redirect("/dashboard/organization")
}
