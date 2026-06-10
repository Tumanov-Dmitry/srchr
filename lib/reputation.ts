import type { ReputationCategory } from "@/types"

export const reputationCategoryLabels: Record<ReputationCategory, string> = {
  profile: "Профиль и верификация",
  cases: "Кейсы",
  articles: "Статьи",
  reviews: "Отзывы",
  recommendations: "Рекомендации",
  tenders: "Задания",
  events: "Мероприятия",
  activity: "Активность",
}

export const reputationCategoryOrder = Object.keys(
  reputationCategoryLabels,
) as ReputationCategory[]

export const reputationEventLabels: Record<string, string> = {
  profile_completed: "Профиль заполнен",
  profile_published: "Профиль опубликован",
  case_published: "Опубликован кейс",
  article_published: "Опубликована статья",
  case_moderation_passed: "Кейс прошёл модерацию",
  article_moderation_passed: "Статья прошла модерацию",
  review_received: "Получен отзыв",
  review_with_comment: "Получен отзыв с комментарием",
  recommendation_received: "Получена рекомендация",
  recommendation_from_expert: "Рекомендация эксперта",
  recommendation_from_contractor: "Рекомендация подрядчика",
  recommendation_from_company: "Рекомендация компании",
  tender_response_created: "Отправлен отклик",
  tender_won: "Победа в задании",
  tender_completed: "Задание завершено",
  event_created: "Опубликовано мероприятие",
  event_participated: "Участие в мероприятии",
  event_speaker: "Выступление на мероприятии",
  material_liked: "Реакция на материал",
  platform_activity: "Активность на платформе",
}
