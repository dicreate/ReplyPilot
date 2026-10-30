import { describe, expect, it } from 'vitest'
import { emptyKeywordForm, keywordFormSchema } from './schema'

const validBase = {
  ...emptyKeywordForm,
  keyword: 'чек-лист',
  message: 'Привет!',
  buttons: [{ title: 'Открыть', type: 'url', url: 'https://example.com', payload: '' }],
}

describe('keywordFormSchema', () => {
  it('пропускает корректную форму', () => {
    const result = keywordFormSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('отклоняет запрещённые символы в ключевом слове', () => {
    const result = keywordFormSchema.safeParse({ ...validBase, keyword: 'цена<"&' })
    expect(result.success).toBe(false)
  })

  it('требует https:// у url-кнопки', () => {
    const result = keywordFormSchema.safeParse({
      ...validBase,
      buttons: [{ title: 'Открыть', type: 'url', url: 'http://insecure.com', payload: '' }],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const flat = result.error.flatten()
      const btnIssues = flat.fieldErrors.buttons ?? []
      expect(String(btnIssues[0] ?? JSON.stringify(btnIssues))).toMatch(/https/)
    }
  })

  it('требует payload у postback-кнопки', () => {
    const result = keywordFormSchema.safeParse({
      ...validBase,
      buttons: [{ title: 'Дальше', type: 'postback', url: '', payload: '' }],
    })
    expect(result.success).toBe(false)
  })

  it('требует хотя бы один пост при scope=specific', () => {
    const result = keywordFormSchema.safeParse({
      ...validBase,
      postScope: 'specific',
      mediaIds: [],
    })
    expect(result.success).toBe(false)
  })

  it('ограничивает длину ключевого слова 50 символами', () => {
    const result = keywordFormSchema.safeParse({
      ...validBase,
      keyword: 'k'.repeat(51),
    })
    expect(result.success).toBe(false)
  })
})
