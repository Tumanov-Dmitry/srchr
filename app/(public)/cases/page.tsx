import { redirect } from "next/navigation"

export default function CasesPage() {
  redirect("/media?type=case")
}
