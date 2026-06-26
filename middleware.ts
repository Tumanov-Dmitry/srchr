import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const decodedPathname = decodeURIComponent(pathname)

  if (decodedPathname.startsWith("/@") && decodedPathname.length > 2) {
    const slug = decodedPathname.slice(2).split("/")[0]
    const url = request.nextUrl.clone()
    url.pathname = `/experts/${slug}`
    return NextResponse.redirect(url)
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
