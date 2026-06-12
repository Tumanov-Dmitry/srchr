import { ArrowUpRight, Building2, MapPin } from "@/components/ui/icons"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

type CompanyCardProps = {
  name: string
  description: string
  city?: string
  logoUrl?: string
  industry?: string
  employees?: string
}

export function CompanyCard({
  name,
  description,
  city,
  logoUrl,
  industry,
  employees,
}: CompanyCardProps) {
  return (
    <Card className="flex h-full flex-col shadow-elevation-1">
      <CardHeader className="flex-row items-center gap-4">
        <Avatar className="size-12 rounded-lg">
          <AvatarImage src={logoUrl} alt={name} />
          <AvatarFallback className="rounded-lg">
            <Building2 className="size-5" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{name}</h3>
          {city ? (
            <span className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {city}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <div className="flex flex-wrap gap-2">
          {industry ? <Badge variant="secondary">{industry}</Badge> : null}
          {employees ? <Badge variant="outline">{employees}</Badge> : null}
        </div>
      </CardContent>
      <CardFooter className="justify-end border-t pt-4">
        <Button variant="ghost" size="sm">
          Подробнее
          <ArrowUpRight />
        </Button>
      </CardFooter>
    </Card>
  )
}
