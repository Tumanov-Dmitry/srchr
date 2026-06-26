"use client"

import Link from "next/link"
import { Menu, Search } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NavItem = {
  href: string
  label: string
}

export function SiteMobileNav({ items }: { items: NavItem[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          aria-label="Открыть меню"
          className="md:hidden"
          size="icon"
          variant="outline"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[min(88vw,360px)]">
        <SheetHeader>
          <SheetTitle>Навигация</SheetTitle>
        </SheetHeader>
        <form action="/search" className="grid gap-2 px-4 pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Поиск"
              className="h-11 pl-10"
              name="q"
              placeholder="Поиск по SRCHR"
              type="search"
            />
          </div>
          <SheetClose asChild>
            <Button type="submit">Найти</Button>
          </SheetClose>
        </form>
        <nav className="grid gap-1 px-4">
          {items.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                className="rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-muted"
                href={item.href}
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
