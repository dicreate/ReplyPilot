/**
 * Домен-типы API. Полностью соответствуют бэкенду (models/Keyword.js, controllers).
 * Кнопочное ограничение Instagram: до 3 кнопок, title до 20 символов.
 */

export type ButtonType = 'url' | 'postback'

export interface RuleButton {
  /** Текст на кнопке (до 20 символов) */
  title: string
  type: ButtonType
  /** Для type='url' — ссылка (только https://) */
  url?: string
  /** Для type='postback' — id шага воронки или кастомный код (напр. STEP_DETAILS) */
  payload?: string
}

export interface KeywordStep {
  id: string
  name: string
  /** До 1000 символов */
  message: string
  buttons: RuleButton[]
}

export interface KeywordRule {
  _id: string
  keyword: string
  message: string
  messageForNonFollowers?: string
  enableFollowCheckButton?: boolean
  followButtonText?: string
  notFollowedYetMessage?: string
  /** Пустой массив = «все посты» */
  mediaIds?: string[]
  buttons?: RuleButton[]
  steps?: KeywordStep[]
  matchCount?: number
  lastUsed?: string
  createdAt: string
  updatedAt?: string
  isActive?: boolean
}

export interface MediaPost {
  id: string
  caption?: string
  media_url?: string
  thumbnail_url?: string
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  timestamp?: string
  comments_count?: number
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

export interface PlaceholderMap {
  [placeholder: string]: string
}

/* ---------- Analytics ---------- */

export interface AnalyticsDay {
  date: string
  dmsSent: number
  commentsProcessed: number
  keywordMatches: number
  errors: number
}

export interface AnalyticsSummary {
  totalDmsSent: number
  totalCommentsProcessed: number
  successRate: number
  totalKeywordMatches: number
  totalErrors: number
}

export interface KeywordStat {
  keyword: string
  matchCount: number
  lastUsed?: string
  dmsSent?: number
}

export interface AnalyticsKeywords {
  keywordStats: KeywordStat[]
  recentMatches: Array<{ _id: string; count: number; dmsSent: number }>
}

export interface AnalyticsTimeline {
  timeline: AnalyticsDay[]
}

/* ---------- Media processing ---------- */

export interface ProcessResultComment {
  author: string
  text: string
  keywordMatched?: string | null
  dmSent?: boolean
}

export interface ProcessResult {
  totalComments: number
  newComments: number
  keywordMatches: number
  dmsSent: number
  skippedByAge?: number
  errors?: number
  processedComments?: ProcessResultComment[]
}

export interface HistoryItem {
  _id: string
  mediaId: string
  commentAuthor: string
  commentText: string
  keywordMatched?: string | null
  dmSent?: boolean
  errorMessage?: string
  processedAt: string
}

export interface StorageInfo {
  total: number
  oldestProcessedAt?: string
  ttlDays?: number
  totalErrorsAllTime?: number
}

export interface ProcessingHistory {
  history: HistoryItem[]
  storage?: StorageInfo
}
