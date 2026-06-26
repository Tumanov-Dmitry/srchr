"use client"

import { useState } from "react"
import { Search } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type GlobalSearchFormProps = {
  defaultQuery?: string
  defaultSort?: string
  defaultPro?: string
}

export function GlobalSearchForm({
  defaultQuery = "",
  defaultSort = "rating",
  defaultPro = "first",
}: GlobalSearchFormProps) {
  const [proFirst, setProFirst] = useState(defaultPro !== "off")

  return (
    <form
      action="/search"
      className="grid gap-3 rounded-xl border bg-card p-4 shadow-elevation-1 lg:grid-cols-[minmax(0,1fr)_220px_auto]"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Поиск"
          className="h-11 pl-10"
          defaultValue={defaultQuery}
          name="q"
          placeholder="Услуга, агентство, эксперт, кейс или статья"
          type="search"
        />
      </div>
      <FormSelect
        defaultValue={defaultSort}
        name="sort"
        options={[
          { value: "rating", label: "По рейтингу" },
          { value: "relevance", label: "По релевантности" },
          { value: "newest", label: "Сначала новые" },
          { value: "name", label: "По названию" },
        ]}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input name="pro" type="hidden" value={proFirst ? "first" : "off"} />
        <div className="flex min-h-11 items-center gap-3 rounded-lg border bg-background px-3">
          <Checkbox
            checked={proFirst}
            id="search-pro-first"
            onCheckedChange={(checked) => setProFirst(checked === true)}
          />
          <Label className="whitespace-nowrap" htmlFor="search-pro-first">
            Сначала pro
          </Label>
        </div>
        <Button className="h-11" type="submit">
          Найти
        </Button>
      </div>
    </form>
  )
}
