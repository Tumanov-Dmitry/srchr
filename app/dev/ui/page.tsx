"use client"

import * as React from "react"
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Inbox,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react"
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
} from "recharts"

import {
  CaseCard,
  ContractorCard,
  EmptyState,
  EventCard,
  FilterBar,
  PageHeader,
  PageShell,
  ProjectCard,
  SearchBar,
  SectionCard,
  StatusBadge,
} from "@/components/srchr"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Combobox } from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast, Toaster } from "@/components/ui/toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const chartData = [
  { month: "Янв", views: 186 },
  { month: "Фев", views: 305 },
  { month: "Мар", views: 237 },
  { month: "Апр", views: 373 },
  { month: "Май", views: 409 },
  { month: "Июн", views: 512 },
]

const chartConfig = {
  views: {
    label: "Просмотры",
    color: "var(--primary)",
  },
} satisfies ChartConfig

const serviceOptions = [
  { value: "hr-brand", label: "HR-брендинг" },
  { value: "evp", label: "EVP" },
  { value: "research", label: "Исследования" },
]

export default function UiPlaygroundPage() {
  const [service, setService] = React.useState("")
  const [collapsibleOpen, setCollapsibleOpen] = React.useState(false)

  return (
    <TooltipProvider>
      <PageShell className="space-y-12 pb-24">
        <PageHeader
          eyebrow="SRCHR 2.0"
          title="Дизайн-система"
          description="Внутренний каталог компонентов, токенов и продуктовых паттернов платформы."
          actions={
            <>
              <Button variant="outline">
                <Settings2 />
                Токены
              </Button>
              <Button>
                <Plus />
                Новый экран
              </Button>
            </>
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">SRCHR</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>UI Playground</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink href="#base">Основа</NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#data">Данные</NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#cards">Карточки</NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <section className="space-y-5">
          <h2 className="type-h2">Токены</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Primary", "bg-primary", "#06B53F"],
              ["Pink", "bg-srchr-pink", "#EC8ACB"],
              ["Yellow", "bg-srchr-yellow", "#F7D11A"],
              ["Background", "bg-background", "#F7F5F1"],
              ["Text", "bg-foreground", "#1E2420"],
            ].map(([name, color, value]) => (
              <Card key={name} className="overflow-hidden shadow-none">
                <div className={`h-20 ${color}`} />
                <CardContent className="flex items-center justify-between p-4 text-sm">
                  <strong>{name}</strong>
                  <span className="text-muted-foreground">{value}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="shadow-none">
            <CardContent className="space-y-6 p-6">
              <p className="type-display">Display</p>
              <p className="type-h1">Заголовок H1</p>
              <p className="type-h2">Заголовок H2</p>
              <p className="type-h3">Заголовок H3</p>
              <p className="type-body">Основной текст интерфейса SRCHR.</p>
              <p className="type-small text-muted-foreground">
                Малый текст для пояснений.
              </p>
              <p className="type-caption text-muted-foreground">
                CAPTION · 12 PX
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="base" className="space-y-5">
          <h2 className="type-h2">Базовые элементы</h2>
          <SectionCard
            title="Кнопки и статусы"
            description="Основные действия и состояния платформы."
          >
            <div className="flex flex-wrap gap-3">
              <Button>Основная</Button>
              <Button variant="secondary">Вторичная</Button>
              <Button variant="outline">Контурная</Button>
              <Button variant="ghost">Призрачная</Button>
              <Button variant="destructive">Удалить</Button>
              <Button variant="link">Ссылка</Button>
              <Button size="icon" aria-label="Уведомления">
                <Bell />
              </Button>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-wrap gap-2">
              <Badge>Новый</Badge>
              <Badge variant="secondary">HR-брендинг</Badge>
              <Badge variant="outline">Эксперт</Badge>
              <StatusBadge tone="success">Опубликован</StatusBadge>
              <StatusBadge tone="warning">На модерации</StatusBadge>
              <StatusBadge tone="accent">Продвигается</StatusBadge>
              <StatusBadge tone="danger">Отклонён</StatusBadge>
            </div>
          </SectionCard>

          <div className="grid gap-5 lg:grid-cols-2">
            <SectionCard title="Поля формы">
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="company-name">Название компании</Label>
                  <Input
                    id="company-name"
                    placeholder="Например, HEADSPACE Agency"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    placeholder="Расскажите о специализации"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Услуга</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите услугу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="branding">HR-брендинг</SelectItem>
                      <SelectItem value="evp">EVP</SelectItem>
                      <SelectItem value="research">Исследования</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Combobox</Label>
                  <Combobox
                    options={serviceOptions}
                    value={service}
                    onValueChange={setService}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Выбор и переключатели">
              <div className="space-y-6">
                <label className="flex items-center gap-3 text-sm">
                  <Checkbox defaultChecked />
                  Получать новые задачи
                </label>
                <label className="flex items-center justify-between gap-4 text-sm">
                  Публичный профиль
                  <Switch defaultChecked />
                </label>
                <RadioGroup defaultValue="agency" className="grid gap-3">
                  <label className="flex items-center gap-3 text-sm">
                    <RadioGroupItem value="agency" />
                    Агентство
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <RadioGroupItem value="expert" />
                    Независимый эксперт
                  </label>
                </RadioGroup>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="Дмитрий"
                    />
                    <AvatarFallback>ДТ</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Дмитрий Туманов</p>
                    <p className="text-xs text-muted-foreground">
                      Product lead
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <Tabs defaultValue="contractors">
            <TabsList>
              <TabsTrigger value="contractors">Подрядчики</TabsTrigger>
              <TabsTrigger value="experts">Эксперты</TabsTrigger>
              <TabsTrigger value="media">Медиа</TabsTrigger>
            </TabsList>
            <TabsContent value="contractors">
              <Alert>
                <Sparkles />
                <AlertTitle>Подрядчики</AlertTitle>
                <AlertDescription>
                  Активная вкладка каталога подрядчиков.
                </AlertDescription>
              </Alert>
            </TabsContent>
            <TabsContent value="experts">
              <Alert>
                <CircleHelp />
                <AlertTitle>Эксперты</AlertTitle>
                <AlertDescription>
                  Публичные профили специалистов.
                </AlertDescription>
              </Alert>
            </TabsContent>
            <TabsContent value="media">
              <Alert>
                <Inbox />
                <AlertTitle>Медиа</AlertTitle>
                <AlertDescription>Статьи и кейсы платформы.</AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </section>

        <section className="space-y-5">
          <h2 className="type-h2">Всплывающие элементы</h2>
          <Card>
            <CardContent className="flex flex-wrap gap-3 p-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Создать подборку</DialogTitle>
                    <DialogDescription>
                      Соберите подрядчиков и экспертов в одной коллекции.
                    </DialogDescription>
                  </DialogHeader>
                  <Input placeholder="Название подборки" />
                  <DialogFooter>
                    <Button>Создать</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Sheet</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Фильтры каталога</SheetTitle>
                    <SheetDescription>
                      Уточните параметры поиска.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 px-4">
                    <SearchBar placeholder="Поиск" />
                    <Combobox options={serviceOptions} />
                  </div>
                </SheetContent>
              </Sheet>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline">Drawer</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Быстрое действие</DrawerTitle>
                    <DrawerDescription>
                      Нижняя панель для мобильных сценариев.
                    </DrawerDescription>
                  </DrawerHeader>
                  <DrawerFooter>
                    <Button>Продолжить</Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreHorizontal />
                    Меню
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Действия</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Редактировать</DropdownMenuItem>
                  <DropdownMenuItem>Добавить в коллекцию</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Popover</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <p className="text-sm">Компактный контекстный блок.</p>
                </PopoverContent>
              </Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" aria-label="Подсказка">
                    <CircleHelp />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Репутация складывается из активности
                </TooltipContent>
              </Tooltip>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="link">@dmitry</Button>
                </HoverCardTrigger>
                <HoverCardContent className="flex gap-3">
                  <Avatar>
                    <AvatarFallback>ДТ</AvatarFallback>
                  </Avatar>
                  <div>
                    <strong>Дмитрий Туманов</strong>
                    <p className="text-sm text-muted-foreground">
                      Эксперт SRCHR
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <Button onClick={() => toast.success("Изменения сохранены")}>
                Toast
              </Button>
            </CardContent>
          </Card>
        </section>

        <section id="data" className="space-y-5">
          <h2 className="type-h2">Таблицы и данные</h2>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Просмотры каталога</CardTitle>
                <CardDescription>Динамика за шесть месяцев</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="min-h-64 w-full"
                >
                  <RechartsBarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="views" fill="var(--color-views)" radius={8} />
                  </RechartsBarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Заполнение профиля</CardTitle>
                <CardDescription>
                  До публикации осталось два шага
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-end justify-between">
                  <strong className="text-3xl">72%</strong>
                  <span className="text-sm text-muted-foreground">
                    Хороший старт
                  </span>
                </div>
                <Progress value={72} />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Компания</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Репутация</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    HEADSPACE Agency
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone="success">Опубликован</StatusBadge>
                  </TableCell>
                  <TableCell>1840</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" aria-label="Меню">
                      <MoreHorizontal />
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Сёрчер</TableCell>
                  <TableCell>
                    <StatusBadge tone="warning">Модерация</StatusBadge>
                  </TableCell>
                  <TableCell>920</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" aria-label="Меню">
                      <MoreHorizontal />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <Accordion
            type="single"
            collapsible
            className="rounded-lg border bg-card px-5"
          >
            <AccordionItem value="principles">
              <AccordionTrigger>Принципы SRCHR 2.0</AccordionTrigger>
              <AccordionContent>
                Чистая структура, мягкие формы, выразительные акценты и
                предсказуемые рабочие сценарии.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Collapsible
            open={collapsibleOpen}
            onOpenChange={setCollapsibleOpen}
            className="rounded-lg border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <strong>Дополнительные параметры</strong>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Развернуть">
                  <ChevronDown />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-4 text-sm text-muted-foreground">
              Содержимое сворачиваемого блока для сложных форм и фильтров.
            </CollapsibleContent>
          </Collapsible>
        </section>

        <section id="cards" className="space-y-5">
          <div>
            <h2 className="type-h2">Компоненты SRCHR</h2>
            <p className="mt-2 text-muted-foreground">
              Карточки сущностей для будущих каталогов и рекомендаций.
            </p>
          </div>
          <FilterBar activeCount={2}>
            <SearchBar
              className="min-w-64 flex-1"
              placeholder="Найти в каталоге"
            />
            <Button variant="outline">
              <Menu />
              Категория
            </Button>
            <Button variant="outline">
              <Search />
              Город
            </Button>
          </FilterBar>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ContractorCard
              name="HEADSPACE Agency"
              description="Стратегическое агентство, которое помогает компаниям строить сильный HR-бренд."
              city="Москва"
              rating={4.9}
              reviews={32}
              services={["HR-брендинг", "EVP", "Исследования"]}
              minBudget="от 250 000 ₽"
            />
            <ProjectCard
              title="Разработка EVP для компании 2000 сотрудников"
              company="Технологическая компания"
              budget="500 000 ₽"
              responses={12}
              tags={["EVP", "Исследование"]}
            />
            <CaseCard
              title="Как мы повысили eNPS на 24%"
              author="HEADSPACE Agency"
              category="HR-брендинг"
              result="+24% eNPS за 8 месяцев"
            />
            <EventCard
              title="HR Brand Meetup: новая честность"
              date="24 июня, 19:00"
              location="Москва · offline"
              organizer="SRCHR"
              format="Meetup"
              promoted
            />
          </div>
          <EmptyState
            icon={Inbox}
            title="Здесь пока ничего нет"
            description="Добавьте первый объект, чтобы увидеть, как работает пустое состояние."
            actionLabel="Добавить"
          />
        </section>
      </PageShell>
      <Toaster position="bottom-right" />
    </TooltipProvider>
  )
}
