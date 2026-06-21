"use client"

import { useState } from "react"
import { Building2, ChevronsUpDown, Plus } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import {
  Command,
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
import type { Organization } from "@/types"

type MaterialClientPickerProps = {
  clients: Organization[]
  value: string
  onChange: (name: string, logoUrl?: string) => void
}

export function MaterialClientPicker({
  clients,
  value,
  onChange,
}: MaterialClientPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const normalized = query.trim()
  const hasExactMatch = clients.some(
    (client) =>
      client.name.toLocaleLowerCase("ru") ===
      normalized.toLocaleLowerCase("ru"),
  )

  function choose(name: string, logoUrl?: string) {
    onChange(name, logoUrl)
    setQuery("")
    setOpen(false)
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className="w-full justify-between font-normal"
          type="button"
          variant="outline"
        >
          <span className={value ? "" : "text-muted-foreground"}>
            {value || "Найдите компанию или укажите свою"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command shouldFilter>
          <CommandInput
            onValueChange={setQuery}
            placeholder="Название клиента..."
            value={query}
          />
          <CommandList>
            {normalized && !hasExactMatch ? (
              <CommandGroup heading="Новый клиент">
                <CommandItem
                  onSelect={() => choose(normalized)}
                  value={normalized}
                >
                  <Plus /> Использовать «{normalized}»
                </CommandItem>
              </CommandGroup>
            ) : null}
            <CommandGroup heading="Компании SRCHR">
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  onSelect={() =>
                    choose(client.name, client.logo_url ?? undefined)
                  }
                  value={client.name}
                >
                  <Building2 /> {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
