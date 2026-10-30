import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  AnalyticsKeywords,
  AnalyticsSummary,
  AnalyticsTimeline,
  ApiEnvelope,
} from '@/types/api'

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (days: number) => ['analytics', 'summary', { days }] as const,
  keywords: () => ['analytics', 'keywords'] as const,
  timeline: (days: number) => ['analytics', 'timeline', { days }] as const,
}

export const analyticsSummaryOptions = (days: number) =>
  queryOptions({
    queryKey: analyticsKeys.summary(days),
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AnalyticsSummary>>(
        `/api/analytics/summary?days=${days}`,
      )
      return res.data.data
    },
  })

export const analyticsKeywordsOptions = () =>
  queryOptions({
    queryKey: analyticsKeys.keywords(),
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AnalyticsKeywords>>('/api/analytics/keywords')
      return res.data.data
    },
  })

export const analyticsTimelineOptions = (days: number) =>
  queryOptions({
    queryKey: analyticsKeys.timeline(days),
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<AnalyticsTimeline>>(
        `/api/analytics/timeline?days=${days}`,
      )
      return res.data.data
    },
  })
