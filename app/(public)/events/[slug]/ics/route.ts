import { NextResponse } from "next/server"
import { getPublishedEventBySlug } from "@/lib/supabase/queries"

function escapeIcs(value?: string | null) {
  return (value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}

function formatIcsDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const event = await getPublishedEventBySlug(slug)

  if (!event) return new NextResponse("Not found", { status: 404 })
  if (!event.start_date) return new NextResponse("Event date is missing", { status: 409 })

  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://srchr.ru"}/events/${event.slug}`
  const startsAt = formatIcsDate(event.start_date)
  const endsAt = formatIcsDate(event.end_date ?? event.start_date)
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SRCHR//Events//RU",
    "BEGIN:VEVENT",
    `UID:${event.id}@srchr.ru`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${startsAt}`,
    `DTEND:${endsAt}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    `LOCATION:${escapeIcs([event.city, event.address].filter(Boolean).join(", "))}`,
    `URL:${pageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  })
}
