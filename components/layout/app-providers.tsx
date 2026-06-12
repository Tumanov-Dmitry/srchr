"use client"

import type { ReactNode } from "react"
import { MotionConfig } from "motion/react"

import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <TooltipProvider delayDuration={250}>
        {children}
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </MotionConfig>
  )
}
