import { ArrowUpRight, MapPin, Star } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

type ContractorCardProps = {
  name: string
  description: string
  city?: string
  logoUrl?: string
  rating?: number
  reviews?: number
  services: string[]
  minBudget?: string
}

export function ContractorCard({
  name,
  description,
  city,
  logoUrl,
  rating,
  reviews,
  services,
  minBudget,
}: ContractorCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-elevation-1 transition-colors hover:border-primary/40">
      <CardHeader className="flex-row items-start gap-4">
        <Avatar className="size-12 rounded-lg">
          <AvatarImage src={logoUrl} alt={name} />
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {rating ? (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Star className="size-4 fill-srchr-yellow text-srchr-yellow" />
                {rating}
              </span>
            ) : null}
            {reviews !== undefined ? <span>{reviews} отзывов</span> : null}
            {city ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {city}
              </span>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-5">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <div className="flex flex-wrap gap-2">
          {services.slice(0, 3).map((service) => (
            <Badge key={service} variant="secondary">
              {service}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t pt-4">
        <span className="text-sm font-semibold">
          {minBudget ?? "Бюджет по запросу"}
        </span>
        <Button variant="ghost" size="icon" aria-label={`Открыть ${name}`}>
          <ArrowUpRight />
        </Button>
      </CardFooter>
    </Card>
  )
}
