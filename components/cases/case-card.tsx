import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CaseItem } from "@/types"

export function CaseCard({ item }: { item: CaseItem }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {item.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.cover_url} alt="" className="h-44 w-full object-cover" />
      ) : (
        <div className="h-44 bg-secondary" />
      )}
      <CardHeader>
        <Badge className="w-fit">{item.organizations?.name ?? "Кейс"}</Badge>
        <CardTitle>{item.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {item.short_description ?? "Краткое описание кейса скоро появится."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1" />
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/cases/${item.slug}`}>Смотреть кейс</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
