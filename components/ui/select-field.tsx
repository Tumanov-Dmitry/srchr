"use client"

import * as React from "react"

import { FormSelect } from "@/components/ui/form-select"

type SelectFieldProps = {
  name: string
  defaultValue?: string
  children: React.ReactNode
  className?: string
  id?: string
  disabled?: boolean
}

export function SelectField({
  name,
  defaultValue,
  children,
  className,
  disabled,
}: SelectFieldProps) {
  const options = React.Children.toArray(children).flatMap((child) => {
    if (
      !React.isValidElement<{ value?: string; children?: React.ReactNode }>(
        child,
      )
    ) {
      return []
    }
    const value = child.props.value
    if (!value) return []
    return [
      {
        value,
        label:
          typeof child.props.children === "string"
            ? child.props.children
            : String(child.props.children ?? value),
      },
    ]
  })

  return (
    <FormSelect
      className={className}
      defaultValue={defaultValue}
      disabled={disabled}
      name={name}
      options={options}
    />
  )
}
