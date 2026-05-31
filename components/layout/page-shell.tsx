import { cn } from "@/lib/utils"

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <main className={cn("mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8", className)}>
      {children}
    </main>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  )
}
