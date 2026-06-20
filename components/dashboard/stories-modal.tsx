"use client"

import { useEffect, useState } from "react"
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

export type DashboardStory = {
  id: string
  label: string
  eyebrow: string
  title: string
  description: string
  icon: IconComponent
}

export const contractorStories: DashboardStory[] = [
  {
    id: "profile",
    label: "Сильный профиль",
    eyebrow: "Первый шаг",
    title: "Покажите, чем вы полезны заказчику",
    description:
      "Добавьте специализацию, услуги, город и контакты. Заполненный профиль точнее попадает в поиск и рекомендации.",
    icon: UserRound,
  },
  {
    id: "materials",
    label: "Медиа",
    eyebrow: "Доверие",
    title: "Подтвердите опыт кейсом или статьёй",
    description:
      "Материалы помогают заказчику оценить ваш подход ещё до первого разговора.",
    icon: Sparkles,
  },
  {
    id: "tasks",
    label: "Новые задачи",
    eyebrow: "Возможности",
    title: "Следите за задачами и отвечайте вовремя",
    description:
      "Актуальные опубликованные задачи появляются в кабинете и общем каталоге.",
    icon: BriefcaseBusiness,
  },
]

export const clientStories: DashboardStory[] = [
  {
    id: "search",
    label: "Поиск",
    eyebrow: "Подрядчики",
    title: "Соберите короткий список исполнителей",
    description:
      "Используйте каталог, фильтры и профили, чтобы сравнить специализации и опыт.",
    icon: UserRound,
  },
  {
    id: "tender",
    label: "Создать задачу",
    eyebrow: "Отклики",
    title: "Опишите задачу один раз",
    description:
      "После модерации задача станет доступна экспертам и агентствам, а ответы соберутся в кабинете.",
    icon: BriefcaseBusiness,
  },
  {
    id: "favorites",
    label: "Избранное",
    eyebrow: "Подборка",
    title: "Сохраняйте тех, к кому хотите вернуться",
    description:
      "Коллекции помогают не потерять подрядчиков, экспертов и полезные материалы.",
    icon: Heart,
  },
]

type StoriesModalProps = {
  stories: DashboardStory[]
  initialIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StoriesModal({
  stories,
  initialIndex,
  open,
  onOpenChange,
}: StoriesModalProps) {
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    if (open) setIndex(initialIndex)
  }, [initialIndex, open])

  const story = stories[index]
  const Icon = story.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="flex gap-1 px-5 pt-5" aria-label="Прогресс истории">
          {stories.map((item, itemIndex) => (
            <span
              className={
                itemIndex <= index
                  ? "h-1 flex-1 bg-primary"
                  : "h-1 flex-1 bg-muted"
              }
              key={item.id}
            />
          ))}
        </div>
        <div className="flex min-h-[420px] flex-col p-6 pt-8">
          <span className="grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-6" />
          </span>
          <p className="mt-8 text-sm font-medium text-primary">
            {story.eyebrow}
          </p>
          <DialogTitle className="mt-2 text-2xl leading-tight">
            {story.title}
          </DialogTitle>
          <DialogDescription className="mt-4 text-base leading-7">
            {story.description}
          </DialogDescription>
          <div className="mt-auto flex items-center justify-between pt-8">
            <Button
              aria-label="Предыдущая карточка"
              disabled={index === 0}
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              size="icon"
              variant="outline"
            >
              <ArrowLeft />
            </Button>
            <span className="text-sm text-muted-foreground">
              {index + 1} из {stories.length}
            </span>
            {index === stories.length - 1 ? (
              <Button onClick={() => onOpenChange(false)}>Готово</Button>
            ) : (
              <Button
                aria-label="Следующая карточка"
                onClick={() =>
                  setIndex((current) =>
                    Math.min(stories.length - 1, current + 1),
                  )
                }
                size="icon"
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
