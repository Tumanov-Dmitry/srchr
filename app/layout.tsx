import type { Metadata } from "next"

import { AppProviders } from "@/components/layout/app-providers"

import "./globals.css"

export const metadata: Metadata = {
  title: "SRCHR",
  description: "Платформа для поиска подрядчиков, экспертов и задач",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
