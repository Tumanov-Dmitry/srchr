import * as React from "react"
import { Label } from "@/components/ui/label"

type RequiredLabelProps = React.ComponentProps<typeof Label> & {
  required?: boolean
}

export function RequiredLabel({
  children,
  required = false,
  ...props
}: RequiredLabelProps) {
  return (
    <Label {...props}>
      {children}
      {required ? (
        <span className="ml-1 text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </Label>
  )
}
