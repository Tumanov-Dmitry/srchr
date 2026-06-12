"use client"

import Link from "next/link"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
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
