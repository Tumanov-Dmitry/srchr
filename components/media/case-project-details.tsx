import { Award, ExternalLink } from "@/components/ui/icons"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getCaseWizardData } from "@/lib/material-case"
import type { MaterialDocument } from "@/lib/material-content"

function safeUrl(value: string) {
  try {
    const url = new URL(value)
    return ["http:", "https:"].includes(url.protocol) ? url : null
  } catch {
    return null
  }
}

function embedUrl(value: string) {
  const url = safeUrl(value)
  if (!url) return null
  const host = url.hostname.replace(/^www\./, "")

  if (host === "youtu.be")
    return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`
  if (host.endsWith("youtube.com")) {
    const id =
      url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop()
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (host.endsWith("vimeo.com")) {
    const id = url.pathname.split("/").filter(Boolean).pop()
    return id ? `https://player.vimeo.com/video/${id}` : null
  }
  if (host.endsWith("rutube.ru")) {
    const id = url.pathname.split("/").filter(Boolean).pop()
    return id ? `https://rutube.ru/play/embed/${id}` : null
  }
  if (
    ["vk.com", "vkvideo.ru", "kinescope.io", "boomstream.com"].some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    )
  ) {
    return url.toString()
  }
  return null
}

function isImage(value: string) {
  return /\.(?:jpe?g|png|gif|webp)(?:\?.*)?$/i.test(value)
}

export function CaseProjectDetails({
  document,
}: {
  document: MaterialDocument
}) {
  if (document.meta?.editor !== "case-wizard-v1") return null
  const data = getCaseWizardData(document)
  const intro = safeUrl(data.introMediaUrl)
  const embed = data.introMediaUrl ? embedUrl(data.introMediaUrl) : null
  const projectUrl = safeUrl(data.projectUrl)?.toString() ?? null

  return (
    <div className="mb-10 space-y-8">
      {intro && isImage(intro.toString()) ? (
        <div className="aspect-video overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Вступительная иллюстрация"
            className="size-full object-cover"
            src={intro.toString()}
          />
        </div>
      ) : embed ? (
        <div className="aspect-video overflow-hidden rounded-lg bg-muted">
          <iframe
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="size-full"
            src={embed}
            title="Видео проекта"
          />
        </div>
      ) : null}

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Срок реализации</dt>
          <dd className="mt-1 font-medium">{data.duration}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Бюджет</dt>
          <dd className="mt-1 font-medium">
            {data.hideBudget ? "Скрыт по NDA" : data.budget}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Клиент</dt>
          <dd className="mt-1 flex items-center gap-2 font-medium">
            {!data.hideClient && data.clientLogoUrl ? (
              <Avatar className="size-7">
                <AvatarImage alt="" src={data.clientLogoUrl} />
                <AvatarFallback>{data.clientName.slice(0, 1)}</AvatarFallback>
              </Avatar>
            ) : null}
            {data.hideClient ? "Скрыт по NDA" : data.clientName}
          </dd>
        </div>
      </dl>
      {projectUrl ? (
        <a
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          href={projectUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Открыть проект <ExternalLink />
        </a>
      ) : null}
      {data.serviceNames.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {data.serviceNames.map((name) => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))}
        </div>
      ) : null}

      {data.teamComment ? (
        <blockquote className="border-l-4 border-primary pl-5 text-lg leading-8">
          {data.teamComment}
          {data.teamCommentAuthor ? (
            <footer className="mt-2 text-sm text-muted-foreground">
              {data.teamCommentAuthor}
            </footer>
          ) : null}
        </blockquote>
      ) : null}

      {data.team.length > 0 ? (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Команда проекта</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.team.map((member) => (
              <Card key={member.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="size-12">
                    <AvatarImage alt="" src={member.photoUrl || undefined} />
                    <AvatarFallback>{member.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[member.position, member.company]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {data.awards.length > 0 ? (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">Награды</h2>
          <div className="space-y-2">
            {data.awards.map((award) => {
              const awardUrl = safeUrl(award.url)?.toString()
              return awardUrl ? (
                <a
                  className="flex items-center gap-3 rounded-lg border p-4 font-medium hover:border-primary/40"
                  href={awardUrl}
                  key={award.id}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Award className="text-primary" /> {award.title}
                </a>
              ) : (
                <div
                  className="flex items-center gap-3 rounded-lg border p-4 font-medium"
                  key={award.id}
                >
                  <Award className="text-primary" /> {award.title}
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
