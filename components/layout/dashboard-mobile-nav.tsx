"use client"

import { Menu } from "@/components/ui/icons"

import { DashboardNav } from "@/components/layout/dashboard-nav"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function DashboardMobileNav({
  primaryRole,
}: {
  primaryRole?: string | null
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="lg:hidden" variant="outline">
          <Menu />
          Разделы кабинета
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[min(90vw,380px)] overflow-y-auto" side="left">
        <SheetHeader>
          <SheetTitle>Личный кабинет</SheetTitle>
          <SheetDescription>Выберите нужный раздел</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <DashboardNav primaryRole={primaryRole} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
