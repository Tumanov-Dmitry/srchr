import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type SearchBarProps = React.ComponentProps<typeof Input>

export function SearchBar({ className, ...props }: SearchBarProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="h-11 rounded-lg bg-card pl-10"
        type="search"
        {...props}
      />
    </div>
  )
}
