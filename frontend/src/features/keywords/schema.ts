import { z } from 'zod'
import { WRONG_CHARS } from '@/features/funnels/graph'

export const KEYWORD_MAX = 50
export const MESSAGE_MAX = 1000
export const BUTTON_TITLE_MAX = 20
export const MAX_BUTTONS = 3
export const GATE_MESSAGE_MAX = 1000
export const FOLLOW_BTN_MAX = 20

export const buttonSchema = z
  .object({
    title: z.string().trim().min(1, 'Укажите текст кнопки').max(BUTTON_TITLE_MAX),
    type: z.enum(['url', 'postback']),
    url: z.string().trim().optional().default(''),
    payload: z.string().trim().optional().default(''),
  })
  .superRefine((btn, ctx) => {
    if (btn.type === 'url' && !/^https:\/\/\S+$/i.test(btn.url ?? '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'Ссылка должна начинаться с https://',
      })
    }
    if (btn.type === 'postback' && !btn.payload) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload'],
        message: 'Выберите шаг или укажите код',
      })
    }
  })

export const keywordFormSchema = z
  .object({
    keyword: z
      .string()
      .trim()
      .min(1, 'Введите ключевое слово')
      .max(KEYWORD_MAX, `Максимум ${KEYWORD_MAX} символов`)
      .refine((v) => !WRONG_CHARS.test(v), 'Нельзя использовать символы < > " \' &'),
    message: z
      .string()
      .trim()
      .min(1, 'Введите первое сообщение')
      .max(MESSAGE_MAX, `Максимум ${MESSAGE_MAX} символов`),
    buttons: z.array(buttonSchema).max(MAX_BUTTONS),
    postScope: z.enum(['all', 'specific']),
    mediaIds: z.array(z.string().regex(/^\d+$/, 'Некорректный ID поста')).max(50),
    messageForNonFollowers: z.string().max(GATE_MESSAGE_MAX).optional().default(''),
    enableFollowCheckButton: z.boolean().optional().default(true),
    followButtonText: z.string().max(FOLLOW_BTN_MAX).optional().default(''),
    notFollowedYetMessage: z.string().max(GATE_MESSAGE_MAX).optional().default(''),
  })
  .refine((v) => v.postScope === 'all' || v.mediaIds.length > 0, {
    message: 'Выберите хотя бы один пост',
    path: ['mediaIds'],
  })

export type KeywordFormValues = z.infer<typeof keywordFormSchema>

export const emptyKeywordForm: KeywordFormValues = {
  keyword: '',
  message: '',
  buttons: [],
  postScope: 'all',
  mediaIds: [],
  messageForNonFollowers: '',
  enableFollowCheckButton: true,
  followButtonText: '✅ Я подписался',
  notFollowedYetMessage: '',
}
