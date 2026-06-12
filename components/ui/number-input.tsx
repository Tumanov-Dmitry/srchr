"use client"

import * as React from "react"
import { Minus, Plus } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function NumberInput({
  defaultValue,
  min,
  max,
  step = 1,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type" | "defaultValue"> & {
  defaultValue?: string | number | null
  min?: number | string
  max?: number | string
  step?: number | string
}) {
  const numericMin = min === undefined ? undefined : Number(min)
  const numericMax = max === undefined ? undefined : Number(max)
  const numericStep = Number(step)
  const [value, setValue] = React.useState(
    defaultValue === null || defaultValue === undefined
      ? ""
      : String(defaultValue),
  )

  function change(direction: -1 | 1) {
    const current = Number(value || 0)
    let next = current + direction * numericStep
    if (numericMin !== undefined) next = Math.max(numericMin, next)
    if (numericMax !== undefined) next = Math.min(numericMax, next)
    setValue(String(next))
  }

  return (
    <div className={cn("flex min-w-0 items-center", className)}>
      <Input
        {...props}
        className="rounded-r-none border-r-0 text-right [appearance:textfield]"
        inputMode={numericStep % 1 === 0 ? "numeric" : "decimal"}
        max={max}
        min={min}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d.,-]/g, "")
          setValue(next.replace(",", "."))
        }}
        type="text"
        value={value}
      />
      <Button
        aria-label="Уменьшить"
        className="rounded-none border-r-0"
        onClick={() => change(-1)}
        size="icon"
        type="button"
        variant="outline"
      >
        <Minus />
      </Button>
      <Button
        aria-label="Увеличить"
        className="rounded-l-none"
        onClick={() => change(1)}
        size="icon"
        type="button"
        variant="outline"
      >
        <Plus />
      </Button>
    </div>
  )
}
