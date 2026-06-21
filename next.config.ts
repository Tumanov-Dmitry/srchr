import type { NextConfig } from "next"

const supabaseOrigin = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://api.srchr.ru",
    ).origin
  } catch {
    return "https://api.srchr.ru"
  }
})()

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "frame-src 'self' https://youtube.com https://*.youtube.com https://youtube-nocookie.com https://*.youtube-nocookie.com https://player.vimeo.com https://rutube.ru https://*.rutube.ru https://vk.com https://*.vk.com https://vkvideo.ru https://*.vkvideo.ru https://kinescope.io https://*.kinescope.io https://boomstream.com https://*.boomstream.com",
  `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace("https://", "wss://")}`,
  "upgrade-insecure-requests",
].join("; ")

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/@:slug",
        destination: "/experts/:slug",
      },
    ]
  },
}

export default nextConfig
