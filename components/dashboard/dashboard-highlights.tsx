"use client"

import { useState } from "react"

import {
  StoriesModal,
  type DashboardStory,
} from "@/components/dashboard/stories-modal"
import { cn } from "@/lib/utils"

type DashboardHighlightsProps = {
  stories: DashboardStory[]
}

export function DashboardHighlights({ stories }: DashboardHighlightsProps) {
  const [open, setOpen] = useState(false)
  const [initialIndex, setInitialIndex] = useState(0)

  return (
    <>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {stories.map((story, index) => {
          const Icon = story.icon
          return (
            <button
              className={cn(
                "group flex w-28 shrink-0 flex-col items-center gap-2 rounded-lg p-2 text-center",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              key={story.id}
              onClick={() => {
                setInitialIndex(index)
                setOpen(true)
              }}
              type="button"
            >
              <span className="grid size-16 place-items-center rounded-full border-2 border-primary/35 bg-card text-primary transition-colors group-hover:border-primary group-hover:bg-primary/10">
                <Icon className="size-6" />
              </span>
              <span className="text-xs font-medium leading-4">
                {story.label}
              </span>
            </button>
          )
        })}
      </div>
      <StoriesModal
        initialIndex={initialIndex}
        onOpenChange={setOpen}
        open={open}
        stories={stories}
      />
    </>
  )
}
