"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type FormSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type FormSelectProps = {
  name: string
  options: FormSelectOption[]
  defaultValue?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function FormSelect({
  name,
  options,
  defaultValue,
  placeholder = "Выберите значение",
  className,
  disabled,
}: FormSelectProps) {
  return (
    <Select defaultValue={defaultValue} disabled={disabled} name={name}>
      <SelectTrigger className={cn(className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            disabled={option.disabled}
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
