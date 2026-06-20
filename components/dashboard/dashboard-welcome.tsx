import Link from "next/link"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"

type DashboardWelcomeProps = {
  name: string
  description: string
  actions: Array<{
    href: string
    label: string
    icon: ReactNode
    primary?: boolean
  }>
}

export function DashboardWelcome({
  name,
  description,
  actions,
}: DashboardWelcomeProps) {
  return (
    <section className="border-b pb-7">
      <p className="text-sm font-medium text-primary">Обзор</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
        Добро пожаловать, {name}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            asChild
            key={action.href}
            variant={action.primary ? "default" : "outline"}
          >
            <Link href={action.href}>
              {action.icon}
              {action.label}
            </Link>
          </Button>
        ))}
      </div>
    </section>
  )
}
