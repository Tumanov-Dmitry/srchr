export function encodeMessage(message: string) {
  return Buffer.from(message, "utf8").toString("base64url")
}

export function decodeMessage(message?: string) {
  if (!message) return null

  try {
    return Buffer.from(message, "base64url").toString("utf8")
  } catch {
    return message
  }
}
