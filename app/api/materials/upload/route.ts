import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getRequestIdentifier } from "@/lib/security/rate-limit"
import { createClient } from "@/lib/supabase/server"

const maxFileSize = 10 * 1024 * 1024
const maxUserStorageSize = 250 * 1024 * 1024
const maxUserFiles = 1_000
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

function hasValidSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8
  if (type === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, index) => bytes[index] === byte,
    )
  }
  if (type === "image/gif") {
    const header = new TextDecoder().decode(bytes.slice(0, 6))
    return header === "GIF87a" || header === "GIF89a"
  }
  if (type === "image/webp") {
    return (
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    )
  }
  return false
}

function ownedStoragePath(url: unknown, userId: string) {
  if (typeof url !== "string") return null
  try {
    const parsed = new URL(url)
    const marker = "/storage/v1/object/public/materials/"
    const markerIndex = parsed.pathname.indexOf(marker)
    if (markerIndex < 0) return null
    const path = decodeURIComponent(
      parsed.pathname.slice(markerIndex + marker.length),
    )
    return path.startsWith(`${userId}/`) && !path.includes("..") ? path : null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Требуется авторизация" },
      { status: 401 },
    )
  }

  const rateLimit = checkRateLimit(
    `materials:upload:${user.id}:${getRequestIdentifier(request.headers)}`,
    20,
    60_000,
  )
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Слишком много загрузок. Попробуйте позже." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    )
  }

  const formData = await request.formData()
  const file = formData.get("image")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не выбран" }, { status: 400 })
  }
  if (!allowedTypes.has(file.type) || file.size > maxFileSize) {
    return NextResponse.json(
      { error: "Поддерживаются JPG, PNG, WebP и GIF размером до 10 МБ" },
      { status: 400 },
    )
  }

  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (!hasValidSignature(file.type, signature)) {
    return NextResponse.json(
      { error: "Содержимое файла не соответствует формату изображения" },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const bucket = "materials"
  const { error: bucketError } = await admin.storage.getBucket(bucket)
  if (bucketError) {
    const { error: createError } = await admin.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: maxFileSize,
      allowedMimeTypes: [...allowedTypes],
    })
    if (
      createError &&
      !createError.message.toLowerCase().includes("already exists")
    ) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }
  }

  const { data: existingFiles, error: listError } = await admin.storage
    .from(bucket)
    .list(user.id, { limit: maxUserFiles })
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }
  const usedBytes = (existingFiles ?? []).reduce((total, item) => {
    const size = Number(item.metadata?.size ?? 0)
    return total + (Number.isFinite(size) ? size : 0)
  }, 0)
  if (
    (existingFiles?.length ?? 0) >= maxUserFiles ||
    usedBytes + file.size > maxUserStorageSize
  ) {
    return NextResponse.json(
      { error: "Исчерпана квота хранилища материалов" },
      { status: 413 },
    )
  }

  const extension = extensions[file.type]
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`
  const { error } = await admin.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path)
  return NextResponse.json({ success: 1, file: { url: data.publicUrl } })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: "Требуется авторизация" },
      { status: 401 },
    )
  }

  const body = await request.json().catch(() => null)
  const urls = Array.isArray(body?.urls) ? body.urls.slice(0, 100) : []
  const paths = urls
    .map((url: unknown) => ownedStoragePath(url, user.id))
    .filter((path: string | null): path is string => Boolean(path))
  if (paths.length === 0) return NextResponse.json({ removed: 0 })

  const admin = createAdminClient()
  const { error } = await admin.storage.from("materials").remove(paths)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ removed: paths.length })
}
