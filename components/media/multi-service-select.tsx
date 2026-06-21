"use client"

import { Check, ChevronsUpDown } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Service } from "@/types"

type MultiServiceSelectProps = {
  services: Service[]
  value: string[]
  onChange: (value: string[]) => void
}

export function MultiServiceSelect({
  services,
  value,
  onChange,
}: MultiServiceSelectProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="w-full justify-between font-normal"
          type="button"
          variant="outline"
        >
          <span className="truncate">
            {value.length > 0
              ? value.join(", ")
              : "Выберите категории и услуги"}
          </span>
          <ChevronsUpDown className="shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput placeholder="Найти услугу..." />
          <CommandList>
            <CommandEmpty>Услуги не найдены</CommandEmpty>
            <CommandGroup>
              {services.map((service) => {
                const selected = value.includes(service.name)
                return (
                  <CommandItem
                    key={service.id}
                    onSelect={() =>
                      onChange(
                        selected
                          ? value.filter((item) => item !== service.name)
                          : [...value, service.name],
                      )
                    }
                    value={service.name}
                  >
                    <Check
                      className={cn(selected ? "opacity-100" : "opacity-0")}
                    />
                    {service.name}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
