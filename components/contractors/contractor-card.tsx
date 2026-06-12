import Link from "next/link"
import { ArrowUpRight, Building2, MapPin } from "lucide-react"

import { PublicViewCount } from "@/components/analytics/public-view-count"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { ReputationStats } from "@/components/reputation/reputation-stats"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  ContractorProfile,
  Organization,
  ReputationSummary,
} from "@/types"

type ContractorCardData = Organization & {
  contractor_profiles?: ContractorProfile[]
}

export function ContractorCard({
  contractor,
  favoriteId,
  reputation,
  views,
}: {
  contractor: ContractorCardData
  favoriteId?: string | null
  reputation?: ReputationSummary | null
  views?: number
}) {
  const servicesCount = contractor.organization_services?.length ?? 0
  const profile = contractor.contractor_profiles?.[0]
  const description =
    profile?.short_description ??
    contractor.description ??
    "Описание подрядчика скоро появится."

  return (
    <Card className="group flex h-full flex-col overflow-hidden shadow-elevation-1 transition-colors hover:border-primary/40">
      <CardHeader className="gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {contractor.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="h-full w-full object-cover"
                src={contractor.logo_url}
              />
            ) : (
              <Building2 className="size-5 text-muted-foreground" />
            )}
          </div>
          <FavoriteButton
            initialFavoriteId={favoriteId}
            targetId={contractor.id}
            targetType="company"
          />
        </div>
        <CardTitle className="text-xl leading-snug">
          {contractor.name}
        </CardTitle>
        <CardDescription className="line-clamp-3 min-h-[4.5rem] leading-6">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="mt-auto space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="size-4" />
            {contractor.city ?? "Город не указан"}
          </div>
          <div>
            {servicesCount > 0
              ? `${servicesCount} ${servicesCount === 1 ? "услуга" : "услуг"}`
              : "Услуги пока не указаны"}
          </div>
          <ReputationStats
            compact
            href={`/contractors/${contractor.slug}#reputation`}
            summary={reputation}
          />
          <PublicViewCount views={views} />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild className="w-full justify-between" variant="ghost">
          <Link href={`/contractors/${contractor.slug}`}>
            Открыть профиль
            <ArrowUpRight />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
