const SAFE_AUTH_MESSAGES = new Set([
  "Email not confirmed",
  "User already registered",
  "Password should be at least 6 characters",
])

export function reportServerError(context: string, error: unknown) {
  console.error(`[${context}]`, error)
}

export function getPublicErrorMessage(
  error: unknown,
  fallback = "Не удалось выполнить действие. Попробуйте ещё раз.",
) {
  if (!(error instanceof Error)) return fallback
  return SAFE_AUTH_MESSAGES.has(error.message) ? error.message : fallback
}
