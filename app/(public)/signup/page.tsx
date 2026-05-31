import Link from "next/link"
import { signup } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageShell } from "@/components/layout/page-shell"
import { RequiredLabel } from "@/components/ui/required-label"

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <PageShell className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={signup} className="space-y-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="email" required>Email</RequiredLabel>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="password" required>Пароль</RequiredLabel>
              <Input id="password" name="password" type="password" required />
            </div>
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
            <Button type="submit" className="w-full">
              Создать аккаунт
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-primary">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </PageShell>
  )
}
