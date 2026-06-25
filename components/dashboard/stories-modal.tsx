"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Heart,
  Sparkles,
  UserRound,
} from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import type { IconComponent } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

export type DashboardStorySlide = {
  id: string
  eyebrow?: string
  title: string
  description: string
  backgroundUrl?: string
  backgroundColor?: string
  textColor?: string
  textPosition?: "top" | "center" | "bottom"
  backgroundSize?: "cover" | "contain"
  ctaLabel?: string
  ctaUrl?: string
}

export type DashboardStory = {
  id: string
  label: string
  icon?: IconComponent
  iconName?: string
  slides?: DashboardStorySlide[]
  eyebrow?: string
  title?: string
  description?: string
}

const iconMap: Record<string, IconComponent> = {
  briefcase: BriefcaseBusiness,
  heart: Heart,
  sparkles: Sparkles,
  user: UserRound,
}

export function resolveStoryIcon(story: DashboardStory) {
  return story.icon ?? iconMap[story.iconName ?? ""] ?? Sparkles
}

function slidesFor(story: DashboardStory): DashboardStorySlide[] {
  if (story.slides?.length) return story.slides

  return [
    {
      id: story.id,
      eyebrow: story.eyebrow,
      title: story.title ?? story.label,
      description: story.description ?? "",
      backgroundColor: "#1E2420",
      textColor: "#FFFFFF",
      textPosition: "bottom",
    },
  ]
}

export const contractorStories: DashboardStory[] = [
  {
    id: "profile",
    label: "Сильный профиль",
    iconName: "user",
    slides: [
      {
        id: "profile-main",
        eyebrow: "Первый шаг",
        title: "Покажите, чем вы полезны заказчику",
        description:
          "Добавьте специализацию, услуги, город и контакты. Заполненный профиль точнее попадает в поиск и рекомендации.",
        backgroundColor: "#1E2420",
        textColor: "#FFFFFF",
        textPosition: "bottom",
        ctaLabel: "Редактировать профиль",
        ctaUrl: "/dashboard/contractor/profile",
      },
    ],
  },
  {
    id: "materials",
    label: "Медиа",
    iconName: "sparkles",
    slides: [
      {
        id: "materials-case",
        eyebrow: "Доверие",
        title: "Подтвердите опыт кейсом",
        description:
          "Кейсы помогают заказчику оценить ваш подход ещё до первого разговора.",
        backgroundColor: "#06B53F",
        textColor: "#FFFFFF",
        textPosition: "bottom",
        ctaLabel: "Создать кейс",
        ctaUrl: "/dashboard/media/new/case",
      },
      {
        id: "materials-article",
        eyebrow: "Экспертиза",
        title: "Публикуйте статьи",
        description:
          "Гайды, подборки и мнения усиливают доверие к команде и экспертам.",
        backgroundColor: "#F7F5F1",
        textColor: "#1E2420",
        textPosition: "center",
        ctaLabel: "Создать статью",
        ctaUrl: "/dashboard/media/new/article",
      },
    ],
  },
  {
    id: "tasks",
    label: "Новые задачи",
    iconName: "briefcase",
    slides: [
      {
        id: "tasks-main",
        eyebrow: "Возможности",
        title: "Следите за задачами и отвечайте вовремя",
        description:
          "Актуальные опубликованные задачи появляются в кабинете и общем каталоге.",
        backgroundColor: "#EC8ACB",
        textColor: "#1E2420",
        textPosition: "bottom",
        ctaLabel: "Открыть задачи",
        ctaUrl: "/tenders",
      },
    ],
  },
]

export const clientStories: DashboardStory[] = [
  {
    id: "search",
    label: "Поиск",
    iconName: "user",
    slides: [
      {
        id: "search-main",
        eyebrow: "Подрядчики",
        title: "Соберите короткий список исполнителей",
        description:
          "Используйте каталог, фильтры и профили, чтобы сравнить специализации и опыт.",
        backgroundColor: "#1E2420",
        textColor: "#FFFFFF",
        textPosition: "bottom",
        ctaLabel: "Открыть каталог",
        ctaUrl: "/contractors",
      },
    ],
  },
  {
    id: "tender",
    label: "Создать задачу",
    iconName: "briefcase",
    slides: [
      {
        id: "tender-main",
        eyebrow: "Отклики",
        title: "Опишите задачу один раз",
        description:
          "После модерации задача станет доступна экспертам и агентствам, а ответы соберутся в кабинете.",
        backgroundColor: "#06B53F",
        textColor: "#FFFFFF",
        textPosition: "bottom",
        ctaLabel: "Создать задачу",
        ctaUrl: "/dashboard/client/tenders/new",
      },
    ],
  },
  {
    id: "favorites",
    label: "Избранное",
    iconName: "heart",
    slides: [
      {
        id: "favorites-main",
        eyebrow: "Подборка",
        title: "Сохраняйте тех, к кому хотите вернуться",
        description:
          "Коллекции помогают не потерять подрядчиков, экспертов и полезные материалы.",
        backgroundColor: "#F7D11A",
        textColor: "#1E2420",
        textPosition: "center",
        ctaLabel: "Открыть избранное",
        ctaUrl: "/dashboard/favorites",
      },
    ],
  },
]

type StoriesModalProps = {
  story: DashboardStory | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StoriesModal({ story, open, onOpenChange }: StoriesModalProps) {
  const [index, setIndex] = useState(0)
  const slides = useMemo(() => (story ? slidesFor(story) : []), [story])
  const slide = slides[index]

  useEffect(() => {
    if (open) setIndex(0)
  }, [open, story?.id])

  if (!story || !slide) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div
          className="relative flex min-h-[520px] flex-col overflow-hidden p-5"
          style={{
            backgroundColor: slide.backgroundColor || "#1E2420",
            color: slide.textColor || "#FFFFFF",
          }}
        >
          {slide.backgroundUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className={cn(
                "absolute inset-0 h-full w-full",
                slide.backgroundSize === "contain"
                  ? "object-contain"
                  : "object-cover",
              )}
              src={slide.backgroundUrl}
            />
          ) : null}
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex gap-1" aria-label="Прогресс">
            {slides.map((item, itemIndex) => (
              <span
                className={cn(
                  "h-1 flex-1 rounded-full",
                  itemIndex <= index ? "bg-current" : "bg-current/25",
                )}
                key={item.id}
              />
            ))}
          </div>
          <div
            className={cn(
              "relative z-10 flex flex-1 flex-col",
              slide.textPosition === "top" && "justify-start pt-8",
              slide.textPosition === "center" && "justify-center",
              (!slide.textPosition || slide.textPosition === "bottom") &&
                "justify-end",
            )}
          >
            {slide.eyebrow ? (
              <p className="text-sm font-medium opacity-80">{slide.eyebrow}</p>
            ) : null}
            <DialogTitle className="mt-2 text-3xl leading-tight">
              {slide.title}
            </DialogTitle>
            <DialogDescription className="mt-4 text-base leading-7 text-current/85">
              {slide.description}
            </DialogDescription>
            {slide.ctaLabel && slide.ctaUrl ? (
              <Button asChild className="mt-6 w-fit" variant="secondary">
                <Link href={slide.ctaUrl}>{slide.ctaLabel}</Link>
              </Button>
            ) : null}
          </div>
          <div className="relative z-10 mt-8 flex items-center justify-between">
            <Button
              aria-label="Предыдущий слайд"
              disabled={index === 0}
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              size="icon"
              type="button"
              variant="secondary"
            >
              <ArrowLeft />
            </Button>
            <span className="text-sm opacity-75">
              {index + 1} из {slides.length}
            </span>
            {index === slides.length - 1 ? (
              <Button onClick={() => onOpenChange(false)} variant="secondary">
                Готово
              </Button>
            ) : (
              <Button
                aria-label="Следующий слайд"
                onClick={() =>
                  setIndex((current) => Math.min(slides.length - 1, current + 1))
                }
                size="icon"
                type="button"
                variant="secondary"
              >
                <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
