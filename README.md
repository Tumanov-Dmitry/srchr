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

Если `DATABASE_URL` указывает на Supavisor/pooler и подключение недоступно,
мигратор автоматически попробует применить SQL напрямую через Docker-контейнер
Postgres. По умолчанию используется контейнер `supabase-db`; при необходимости
его можно переопределить:

```env
SUPABASE_DB_CONTAINER=supabase-db
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
```

## Security baseline

Security policies are versioned separately from feature SQL:

```bash
docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres \
  < supabase/sql/security-hardening.sql

docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres \
  < supabase/sql/security-audit.sql
```

Apply `security-hardening.sql` manually with a database owner after reviewing it.
The second command is read-only and prints the resulting RLS, grants, and helper
functions. Security SQL is intentionally not part of the deploy workflow.

Local checks:

```bash
npm run security:check
npm run build
```

## Reputation

The reputation module is installed separately from deploys:

```bash
docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres \
  < supabase/sql/create-reputation.sql
```

The patch creates reputation rules, the immutable event journal, aggregate
summaries, reviews, questionnaire answers, and triggers for existing SRCHR
modules. Point values live in `reputation_rules` and can be adjusted without
changing application code. The patch also performs an idempotent initial
calculation for existing published profiles and content.

After changing point values, an owner can deliberately reprice historical
events and rebuild aggregates:

```sql
select private.reprice_reputation_events();
```

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
