import Link from "next/link"
import { FavoriteCard } from "@/components/favorites/favorite-card"
import { FavoriteCollectionsPanel } from "@/components/favorites/favorite-collections-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getFavoriteCollections,
  getUserFavorites,
} from "@/lib/supabase/queries"

const tabs = [
  { value: "all", label: "Все", empty: "В избранном пока ничего нет" },
  {
    value: "companies",
    label: "Подрядчики",
    empty: "У вас пока нет избранных подрядчиков",
  },
  {
    value: "experts",
    label: "Эксперты",
    empty: "У вас пока нет избранных экспертов",
  },
  { value: "cases", label: "Кейсы", empty: "У вас пока нет избранных кейсов" },
  {
    value: "articles",
    label: "Статьи",
    empty: "У вас пока нет избранных статей",
  },
  {
    value: "events",
    label: "Мероприятия",
    empty: "У вас пока нет избранных мероприятий",
  },
]

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string
    view?: string
    collection?: string
  }>
}) {
  const params = await searchParams
  const view = params.view === "collections" ? "collections" : "all"
  const activeType = tabs.some((tab) => tab.value === params.type)
    ? (params.type ?? "all")
    : "all"
  const [favoriteState, collections] = await Promise.all([
    getUserFavorites(activeType, params.collection),
    getFavoriteCollections(),
  ])
  const activeTab = tabs.find((tab) => tab.value === activeType) ?? tabs[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1">Избранное</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Личные подборки подрядчиков, экспертов, материалов и мероприятий.
        </p>
      </div>

      <Tabs value={view}>
        <TabsList>
          <TabsTrigger asChild value="all">
            <Link href="/dashboard/favorites">Все</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="collections">
            <Link href="/dashboard/favorites?view=collections">Коллекции</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "collections" ? (
        <FavoriteCollectionsPanel
          activeCollectionId={params.collection}
          initialCollections={collections}
        />
      ) : null}

      <Tabs value={activeType}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          {tabs.map((tab) => (
            <TabsTrigger asChild key={tab.value} value={tab.value}>
              <Link
                href={
                  tab.value === "all"
                    ? `/dashboard/favorites${params.collection ? `?view=collections&collection=${params.collection}` : ""}`
                    : `/dashboard/favorites?type=${tab.value}${
                        params.collection
                          ? `&view=collections&collection=${params.collection}`
                          : ""
                      }`
                }
              >
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {favoriteState.isFavoritesTableMissing ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Модуль избранного ещё не подключён к базе.
          </CardContent>
        </Card>
      ) : favoriteState.favorites.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {favoriteState.favorites.map((favorite) => (
            <FavoriteCard favorite={favorite} key={favorite.id} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-lg font-medium">{activeTab.empty}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline">
                <Link href="/contractors">Подрядчики</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/experts">Эксперты</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/media">Медиа</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/events">Мероприятия</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
