import Link from "next/link"
import { Building2, MapPin } from "lucide-react"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { PublicViewCount } from "@/components/analytics/public-view-count"
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
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary">
            {contractor.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contractor.logo_url}
                alt=""
                className="h-10 w-10 rounded object-cover"
              />
            ) : (
              <Building2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <FavoriteButton
            targetId={contractor.id}
            targetType="company"
            initialFavoriteId={favoriteId}
          />
        </div>
        <CardTitle>{contractor.name}</CardTitle>
        <CardDescription className="line-clamp-3">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="mt-auto space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
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
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/contractors/${contractor.slug}`}>Открыть профиль</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
