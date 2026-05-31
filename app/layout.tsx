import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "SRCHR",
  description: "Платформа для поиска digital-подрядчиков и задач",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
