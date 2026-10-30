import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { keywordKeys } from './keywordQueries'
import type { ApiEnvelope, KeywordRule } from '@/types/api'
import type { KeywordFormValues } from './schema'

export interface KeywordResponse {
  success: boolean
  data: KeywordRule
  message?: string
}

const errMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? fallback

async function createKeyword(input: Omit<KeywordFormValues, 'postScope'> & { steps?: KeywordRule['steps'] }) {
  const res = await api.post<KeywordResponse>('/api/keywords', input)
  return res.data.data
}

async function updateKeyword(id: string, input: Partial<KeywordFormValues> & { steps?: KeywordRule['steps'] }) {
  const res = await api.put<KeywordResponse>(`/api/keywords/${id}`, input)
  return res.data.data
}

export function useKeywordMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: keywordKeys.all })

  const create = useMutation({
    mutationFn: createKeyword,
    onSuccess: async (rule) => {
      toast.success(`Правило «${rule.keyword}» создано`)
      await invalidate()
    },
    onError: (err) => toast.error(errMessage(err, 'Не удалось создать правило')),
  })

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<KeywordRule> }) =>
      updateKeyword(id, input as Partial<KeywordFormValues> & { steps?: KeywordRule['steps'] }),
    onSuccess: async () => {
      toast.success('Изменения сохранены')
      await invalidate()
    },
    onError: (err) => toast.error(errMessage(err, 'Не удалось сохранить изменения')),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete<ApiEnvelope<null>>(`/api/keywords/${id}`)
      return id
    },
    onSuccess: async () => {
      toast.success('Правило удалено')
      await invalidate()
    },
    onError: (err) => toast.error(errMessage(err, 'Не удалось удалить правило')),
  })

  return { create, update, remove }
}

export function useFormPlaceholderPreview() {
  // Отдельная мутация, чтобы не кэшировать превью (значение зависит только от текста)
  return useMutation({
    mutationFn: async (message: string) => {
      if (!message.trim()) return null
      const res = await api.post<ApiEnvelope<{ preview: string; validation: unknown }>>(
        '/api/keywords/preview',
        { message },
      )
      return res.data.data
    },
  })
}
