import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageShellProps = {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto min-w-0 w-full max-w-7xl overflow-x-clip px-4 py-8 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </main>
  )
}
