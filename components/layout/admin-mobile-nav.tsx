"use client"

import { Menu } from "@/components/ui/icons"

import { AdminNav } from "@/components/layout/admin-nav"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function AdminMobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="lg:hidden" variant="outline">
          <Menu />
          Разделы админки
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[min(90vw,380px)] overflow-y-auto" side="left">
        <SheetHeader>
          <SheetTitle>SRCHR Admin</SheetTitle>
          <SheetDescription>Управление платформой</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <AdminNav />
        </div>
      </SheetContent>
    </Sheet>
  )
}
