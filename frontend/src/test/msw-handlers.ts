import { http, HttpResponse } from 'msw'
import type { KeywordRule, MediaPost, PlaceholderMap } from '@/types/api'
import { httpBase } from './msw-base'

export const sampleRule: KeywordRule = {
  _id: '665f1234567890abcdef1234',
  keyword: 'чек-лист',
  message: 'Привет, {username}! Держи чек-лист 👇 Извини за рекламу.',
  messageForNonFollowers: 'Чтобы получить чек-лист, подпишитесь на профиль 🙏',
  enableFollowCheckButton: true,
  followButtonText: '✅ Я подписался',
  notFollowedYetMessage: 'Не вижу подписку — проверьте ещё раз!',
  mediaIds: [],
  buttons: [{ title: 'Подробнее', type: 'postback', payload: 's1a2b3c' }],
  steps: [
    {
      id: 's1a2b3c',
      name: 'Что внутри',
      message: 'Внутри — 12 пунктов по росту охватов. Открыть?',
      buttons: [{ title: 'Открыть', type: 'url', url: 'https://example.com/checklist' }],
    },
  ],
  matchCount: 42,
  createdAt: new Date('2026-01-15T10:00:00Z').toISOString(),
}

export const recentMedia: MediaPost[] = [
  {
    id: '17900000000000001',
    caption: 'Post one',
    media_url: 'https://cdn.example/1.jpg',
    media_type: 'IMAGE',
    timestamp: new Date('2026-01-10T00:00:00Z').toISOString(),
    comments_count: 10,
  },
  {
    id: '17900000000000002',
    caption: 'Post two',
    thumbnail_url: 'https://cdn.example/2.jpg',
    media_type: 'IMAGE',
    timestamp: new Date('2026-01-12T00:00:00Z').toISOString(),
    comments_count: 3,
  },
]

const placeholders: PlaceholderMap = {
  '{username}': 'The username of the person who commented',
  '{keyword}': 'The keyword that was matched',
}

export const handlers = [
  http.get(`${httpBase}/api/keywords`, () =>
    HttpResponse.json({ success: true, data: [sampleRule] }),
  ),
  http.get(`${httpBase}/api/keywords/placeholders`, () =>
    HttpResponse.json({ success: true, data: placeholders }),
  ),
  http.get(`${httpBase}/api/media/recent`, () =>
    HttpResponse.json({ success: true, data: recentMedia }),
  ),
]
