import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const maxFileSize = 10 * 1024 * 1024
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

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

  const admin = createAdminClient()
  const bucket = "materials"
  const { error: bucketError } = await admin.storage.getBucket(bucket)
  if (bucketError) {
    const { error: createError } = await admin.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: maxFileSize,
      allowedMimeTypes: [...allowedTypes],
    })
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
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
