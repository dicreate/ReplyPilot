import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApiEnvelope, KeywordRule, MediaPost, PlaceholderMap } from '@/types/api'

export interface MessagePreview {
  preview: string
  validation: {
    valid: boolean
    foundPlaceholders: string[]
    invalidPlaceholders: string[]
    validPlaceholders: string[]
  }
}

export const keywordKeys = {
  all: ['keywords'] as const,
  placeholders: ['keywords', 'placeholders'] as const,
  media: (limit = 24) => ['keywords', 'media', limit] as const,
}

export const keywordsQueryOptions = () =>
  queryOptions({
    queryKey: keywordKeys.all,
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<KeywordRule[]>>('/api/keywords')
      return res.data.data
    },
  })

export const keywordByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [...keywordKeys.all, { id }],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<KeywordRule[]>>('/api/keywords')
      const found = res.data.data.find((k) => k._id === id)
      if (!found) {
        throw new Error('Keyword not found')
      }
      return found
    },
  })

export const placeholdersQueryOptions = () =>
  queryOptions({
    queryKey: keywordKeys.placeholders,
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<PlaceholderMap>>('/api/keywords/placeholders')
      return res.data.data
    },
    staleTime: Number.POSITIVE_INFINITY,
  })

export const recentMediaQueryOptions = (limit = 24) =>
  queryOptions({
    queryKey: keywordKeys.media(limit),
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<MediaPost[]>>('/api/media/recent')
      return res.data.data ?? []
    },
  })

export const previewPlaceholder = async (
  message: string,
): Promise<MessagePreview | null> => {
  if (!message.trim()) return null
  const res = await api.post<ApiEnvelope<MessagePreview>>('/api/keywords/preview', { message })
  return res.data.data
}
