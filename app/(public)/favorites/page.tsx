import Link from "next/link"
import { redirect } from "next/navigation"
import { FavoriteCard } from "@/components/favorites/favorite-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserFavorites } from "@/lib/supabase/queries"

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
]

export default async function PublicFavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams
  const activeType = tabs.some((tab) => tab.value === params.type)
    ? (params.type ?? "all")
    : "all"
  const { user, favorites, isFavoritesTableMissing } =
    await getUserFavorites(activeType)
  const activeTab = tabs.find((tab) => tab.value === activeType) ?? tabs[0]

  if (!user) redirect("/login")

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Избранное</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Персональная подборка подрядчиков, экспертов, кейсов и статей.
          Закрепленные карточки всегда идут первыми.
        </p>
      </div>

      <Tabs value={activeType}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          {tabs.map((tab) => (
            <TabsTrigger asChild key={tab.value} value={tab.value}>
              <Link
                href={
                  tab.value === "all"
                    ? "/favorites"
                    : `/favorites?type=${tab.value}`
                }
              >
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isFavoritesTableMissing ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Таблица favorites пока не создана. Примените SQL из
            supabase/sql/create-favorites.sql, чтобы включить модуль
            избранного.
          </CardContent>
        </Card>
      ) : favorites.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((favorite) => (
            <FavoriteCard favorite={favorite} key={favorite.id} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-lg font-medium">{activeTab.empty}</p>
            <p className="text-sm text-muted-foreground">
              Добавляйте карточки сердечком в каталогах и на публичных
              страницах материалов.
            </p>
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
