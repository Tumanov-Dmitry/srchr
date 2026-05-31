# SRCHR

Стартовый MVP платформы SRCHR на Next.js 15, TypeScript, Tailwind CSS, shadcn/ui-подходе и Supabase.

## Запуск

1. Установите зависимости:

```bash
npm install
```

2. Создайте `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://api.srchr.ru
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/postgres
```

3. Запустите проект:

```bash
npm run dev
```

## Миграции

Для self-hosted Supabase миграции применяются напрямую к Postgres через
`DATABASE_URL`. Пароль и host не хардкодятся, храните их в `.env.local`,
`.env` или переменных окружения.

```bash
npm run db:migrate
```

Скрипт читает SQL-файлы из `supabase/migrations`, применяет только новые
миграции и хранит историю в `public.schema_migrations`.

## Что уже есть

- Supabase Auth: регистрация, вход, выход, текущий пользователь.
- Создание записи в `profiles` после регистрации.
- Onboarding после первого входа: роль подрядчика или компании / HR.
- Создание организации, membership-связи, contractor profile и услуг в Supabase.
- Публичные страницы: главная, подрядчики, кейсы, задачи, вход, регистрация.
- Детальные страницы подрядчика, кейса и задачи.
- Контакты подрядчика доступны только авторизованным пользователям.
- Базовый защищенный dashboard.
- Supabase browser/server/admin clients без хардкода ключей.

## Что намеренно не реализовано

- Платежи и подписки.
- Чат, уведомления, Telegram, email-рассылки.
- Сложная админка.
- Полная логика фильтров и CRUD-форм.
