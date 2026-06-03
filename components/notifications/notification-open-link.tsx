"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

type NotificationOpenLinkProps = ComponentProps<typeof Link> & {
  notificationId: string
}

export function NotificationOpenLink({
  notificationId,
  onClick,
  ...props
}: NotificationOpenLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event)

        if (!event.defaultPrevented) {
          void fetch(`/api/notifications/${notificationId}/read`, {
            method: "POST",
            keepalive: true,
          })
        }
      }}
    />
  )
}
