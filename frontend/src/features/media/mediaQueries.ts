import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  ApiEnvelope,
  MediaPost,
  ProcessResult,
  ProcessingHistory,
} from '@/types/api'

export const mediaKeys = {
  all: ['media'] as const,
  recent: () => ['media', 'recent'] as const,
  history: (failed: boolean) => ['media', 'history', { failed }] as const,
}

export const recentMediaOptions = () =>
  queryOptions({
    queryKey: mediaKeys.recent(),
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<MediaPost[]>>('/api/media/recent')
      return (res.data.data ?? []) as MediaPost[]
    },
  })

export const processingHistoryOptions = (failed = false) =>
  queryOptions({
    queryKey: mediaKeys.history(failed),
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<ProcessingHistory>>(
        `/api/media/history?limit=10${failed ? '&failed=true' : ''}`,
      )
      return res.data.data
    },
  })

export interface ProcessPayload {
  mediaId: string
  sinceHours?: number
}

export async function processMedia({ mediaId, sinceHours }: ProcessPayload): Promise<ProcessResult> {
  const res = await api.post<ApiEnvelope<ProcessResult>>(
    `/api/media/process/${mediaId}`,
    sinceHours != null ? { sinceHours } : {},
  )
  return res.data.data
}
