import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

import { AppProviders } from "@/components/layout/app-providers"
import { cn } from "@/lib/utils"

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
    <html
      lang="ru"
      className={cn(
        GeistSans.variable,
        GeistMono.variable,
        "font-sans antialiased",
      )}
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
