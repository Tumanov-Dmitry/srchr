"use client"

import * as React from "react"
import { format, isValid, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { CalendarDays } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function parseDate(value?: string | null) {
  if (!value) return undefined
  const date = parseISO(value)
  return isValid(date) ? date : undefined
}

export function DatePicker({
  name,
  defaultValue,
  placeholder = "Выберите дату",
  disabled,
  required,
  className,
}: {
  name: string
  defaultValue?: string | null
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
}) {
  const [date, setDate] = React.useState<Date | undefined>(
    parseDate(defaultValue),
  )
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const mountedRef = React.useRef(false)

  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    inputRef.current?.dispatchEvent(new Event("change", { bubbles: true }))
  }, [date])

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <input
        ref={inputRef}
        name={name}
        required={required}
        type="hidden"
        value={date ? format(date, "yyyy-MM-dd") : ""}
      />
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-full justify-between font-normal",
            !date && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
          type="button"
          variant="outline"
        >
          {date ? format(date, "d MMMM yyyy", { locale: ru }) : placeholder}
          <CalendarDays className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          locale={ru}
          mode="single"
          onSelect={(nextDate) => {
            setDate(nextDate)
            if (nextDate) setOpen(false)
          }}
          selected={date}
        />
      </PopoverContent>
    </Popover>
  )
}

export function DateTimePicker({
  name,
  defaultValue,
  placeholder = "Выберите дату и время",
  disabled,
  required,
}: {
  name: string
  defaultValue?: string | null
  placeholder?: string
  disabled?: boolean
  required?: boolean
}) {
  const initialDate = parseDate(defaultValue)
  const [date, setDate] = React.useState<Date | undefined>(initialDate)
  const [time, setTime] = React.useState(
    initialDate ? format(initialDate, "HH:mm") : "12:00",
  )
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const mountedRef = React.useRef(false)
  const value = date ? `${format(date, "yyyy-MM-dd")}T${time}` : ""

  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    inputRef.current?.dispatchEvent(new Event("change", { bubbles: true }))
  }, [date, time])

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <input
        ref={inputRef}
        name={name}
        required={required}
        type="hidden"
        value={value}
      />
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "w-full justify-between font-normal",
            !date && "text-muted-foreground",
          )}
          disabled={disabled}
          type="button"
          variant="outline"
        >
          {date
            ? `${format(date, "d MMMM yyyy", { locale: ru })}, ${time}`
            : placeholder}
          <CalendarDays className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          locale={ru}
          mode="single"
          onSelect={setDate}
          selected={date}
        />
        <div className="flex items-center gap-3 border-t p-3">
          <label
            className="text-sm text-muted-foreground"
            htmlFor={`${name}-time`}
          >
            Время
          </label>
          <input
            className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
            id={`${name}-time`}
            onChange={(event) => setTime(event.target.value)}
            type="time"
            value={time}
          />
          <Button onClick={() => setOpen(false)} size="sm" type="button">
            Готово
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
