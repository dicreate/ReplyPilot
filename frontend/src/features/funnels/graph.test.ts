import { describe, expect, it } from 'vitest'
import {
  buttonIdFromHandle,
  funnelGraphToSavePayload,
  keywordToFunnelGraph,
  normalizeStepPayload,
  sourceHandle,
  validateFunnel,
  type FunnelNode,
  type StepNodeData,
  type TriggerNodeData,
} from './graph'
import type { KeywordRule } from '@/types/api'

const KEYWORD_ID = '665f1234567890abcdef1234'
const STEP_ID = 's1a2b3c'

const baseRule: KeywordRule = {
  _id: KEYWORD_ID,
  keyword: 'чек-лист',
  message: 'Привет, {username}!',
  mediaIds: [],
  buttons: [{ title: 'Подробнее', type: 'postback', payload: `STEP_${KEYWORD_ID}_${STEP_ID}` }],
  steps: [
    {
      id: STEP_ID,
      name: 'Что внутри',
      message: 'Внутри — 12 пунктов. Открыть?',
      buttons: [{ title: 'Открыть', type: 'url', url: 'https://example.com/checklist' }],
    },
  ],
  createdAt: new Date().toISOString(),
}

const getNode = (nodes: FunnelNode[], id: string) => {
  const node = nodes.find((n) => n.id === id)
  expect(node).toBeDefined()
  return node!
}

describe('keywordToFunnelGraph', () => {
  it('создаёт trigger, gate и step ноды из правила', () => {
    const rule: KeywordRule = {
      ...baseRule,
      messageForNonFollowers: 'Подпишитесь сначала 🙏',
      followButtonText: '✅ Подписался',
    }
    const { nodes, edges } = keywordToFunnelGraph(rule)

    expect(nodes.map((n) => n.id)).toEqual(['trigger', 'gate', `step-${STEP_ID}`])
    expect(
      edges.find((e) => e.source === 'trigger' && e.target === 'gate'),
    ).toMatchObject({ type: 'gate-edge', deletable: false })

    const triggerData = getNode(nodes, 'trigger').data as TriggerNodeData
    expect(triggerData.keyword).toBe('чек-лист')
    expect(triggerData.buttons[0]).toMatchObject({ type: 'postback', targetStepId: STEP_ID })

    // Ребро от триггерной кнопки ведёт в step-ноду
    const btnId = triggerData.buttons[0].id
    expect(edges.find((e) => e.id === `edge-trigger-${btnId}`)).toMatchObject({
      target: `step-${STEP_ID}`,
      sourceHandle: sourceHandle(btnId),
    })
  })

  it('без follow-gate нода gate не создаётся', () => {
    const { nodes, edges } = keywordToFunnelGraph(baseRule)
    expect(nodes.some((n) => n.id === 'gate')).toBe(false)
    expect(edges.some((e) => e.id === 'edge-gate')).toBe(false)
  })

  it('распознаёт payload в формате бэкенда STEP_<keywordId>_<stepId>', () => {
    const rule: KeywordRule = {
      ...baseRule,
      buttons: [{ title: 'Дальше', type: 'postback', payload: `STEP_${'a'.repeat(24)}_x99` }],
      steps: [{ id: 'x99', name: '', message: 'm', buttons: [] }],
    }
    const { nodes, edges } = keywordToFunnelGraph(rule)
    expect(getNode(nodes, 'step-x99').type).toBe('step')
    expect(edges.some((e) => e.target === 'step-x99')).toBe(true)
  })

  it('кастомный неизвестный payload не рвёт граф (без ребра)', () => {
    const rule: KeywordRule = {
      ...baseRule,
      buttons: [{ title: 'Куда-то', type: 'postback', payload: 'STEP_UNKNOWN' }],
    }
    const { nodes, edges } = keywordToFunnelGraph(rule)
    const triggerData = getNode(nodes, 'trigger').data as TriggerNodeData
    expect(triggerData.buttons[0].targetStepId).toBeNull()
    expect(triggerData.buttons[0].customPayload).toBe('STEP_UNKNOWN')
    expect(edges.filter((e) => e.target.startsWith('step-')).length).toBe(0)
  })

  it('легаси-payload по имени шага резолвится в targetStepId — переименование не рвёт переход', () => {
    // Старая запись: в payload хранится имя шага, не id
    const legacyRule: KeywordRule = {
      ...baseRule,
      buttons: [{ title: 'Подробнее', type: 'postback', payload: 'Что внутри' }],
      steps: [{ id: STEP_ID, name: 'Что внутри', message: 'Внутри — 12 пунктов. Открыть?', buttons: [] }],
    }
    const { nodes, edges } = keywordToFunnelGraph(legacyRule)
    expect(edges.some((e) => e.target === `step-${STEP_ID}`)).toBe(true)

    // Пользователь переименовывает шаг НА КАНВЕ — граф уже держит ссылку по id
    const stepNode = nodes.find((n) => n.id === `step-${STEP_ID}`)!
    ;(stepNode.data as StepNodeData).name = 'Совсем другое имя'
    const saved = funnelGraphToSavePayload(legacyRule, { nodes, edges })
    expect(saved.steps[0].name).toBe('Совсем другое имя')
    expect(saved.buttons[0].payload).toBe(STEP_ID)
  })

  describe('normalizeStepPayload (легаси-миграция для диалога)', () => {
    const rule: KeywordRule = {
      ...baseRule,
      buttons: [],
      steps: [{ id: STEP_ID, name: 'Что внутри', message: 'm', buttons: [] }],
    }

    it('имя шага → stepId', () => {
      expect(normalizeStepPayload('Что внутри', rule)).toBe(STEP_ID)
    })

    it('уже stepId', () => {
      expect(normalizeStepPayload(STEP_ID, rule)).toBe(STEP_ID)
    })

    it('формат бэка STEP_<keywordId>_<stepId>', () => {
      expect(normalizeStepPayload(`STEP_${KEYWORD_ID}_${STEP_ID}`, rule)).toBe(STEP_ID)
    })

    it('кастомный код без совпадений остаётся как есть', () => {
      expect(normalizeStepPayload('STEP_DETAILS', rule)).toBe('STEP_DETAILS')
      expect(normalizeStepPayload('', rule)).toBe('')
    })

    it('после переименования шага stale-имя не сохраняется как id (ссылка рвётся честно)', () => {
      const renamed: KeywordRule = { ...rule, steps: [{ ...(rule.steps ?? [])[0], name: 'Другое имя' }] }
      expect(normalizeStepPayload('Что внутри', renamed)).toBe('Что внутри')
    })
  })
})

describe('funnelGraphToSavePayload (round-trip)', () => {
  it('сохраняет stepId, кнопку-URL и postback-переходы', () => {
    const graph = keywordToFunnelGraph(baseRule)
    const payload = funnelGraphToSavePayload(baseRule, graph)

    expect(payload.keyword).toBe('чек-лист')
    expect(payload.message).toBe('Привет, {username}!')
    expect(payload.mediaIds).toEqual([])
    expect(payload.steps).toHaveLength(1)

    const step = payload.steps[0]
    expect(step.id).toBe(STEP_ID)
    expect(step.name).toBe('Что внутри')
    expect(step.buttons[0]).toEqual({
      title: 'Открыть',
      type: 'url',
      url: 'https://example.com/checklist',
      payload: 'skip_0',
    })

    // Кнопка триггера: postback → payload = целевой stepId (совместимо с бэкендом)
    expect(payload.buttons[0]).toEqual({
      title: 'Подробнее',
      type: 'postback',
      url: '',
      payload: STEP_ID,
    })
  })

  it('несоединённая postback-кнопка сохраняет кастомный payload', () => {
    const graph = keywordToFunnelGraph({
      ...baseRule,
      buttons: [{ title: 'Куда-то', type: 'postback', payload: 'STEP_UNKNOWN' }],
    })
    const payload = funnelGraphToSavePayload(
      { ...baseRule, buttons: [] },
      graph,
    )
    expect(payload.buttons[0].payload).toBe('STEP_UNKNOWN')
  })

  it('полный round-trip: save → load → save идемпотентен по шагам', () => {
    const graph1 = keywordToFunnelGraph(baseRule)
    const payload1 = funnelGraphToSavePayload(baseRule, graph1)

    // правило после сохранения на бэкенде
    const rule2: KeywordRule = { ...baseRule, ...payload1 }
    const graph2 = keywordToFunnelGraph(rule2)
    const payload2 = funnelGraphToSavePayload(rule2, graph2)

    expect(payload2.steps.map((s) => s.id)).toEqual(payload1.steps.map((s) => s.id))
    expect(payload2.steps.map((s) => [s.name, s.message])).toEqual(
      payload1.steps.map((s) => [s.name, s.message]),
    )
    expect(payload2.buttons.map((b) => [b.type, b.payload])).toEqual(
      payload1.buttons.map((b) => [b.type, b.payload]),
    )
  })
})

describe('validateFunnel', () => {
  it('пустое первое сообщение — ошибка на trigger', () => {
    const graph = keywordToFunnelGraph({ ...baseRule, message: '   ' })
    const issues = validateFunnel(graph.nodes.length, graph)
    expect(issues.some((i) => i.severity === 'error' && i.nodeId === 'trigger')).toBe(true)
  })

  it('несоединённая кнопка и недостижимый шаг — предупреждения, не ошибки', () => {
    const graph = keywordToFunnelGraph(baseRule)
    // отвяжем кнопку: targetStepId → null
    const trigger = graph.nodes.find((n) => n.id === 'trigger')!
    const triggerData = trigger.data as TriggerNodeData
    trigger.data = {
      ...triggerData,
      buttons: triggerData.buttons.map((b) => ({ ...b, targetStepId: null })),
    }
    const issues = validateFunnel(graph.nodes.length, graph)
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0)
    expect(issues.filter((i) => i.severity === 'warning').length).toBeGreaterThan(0)
  })

  it('> 20 шагов — ошибка лимита', () => {
    const graph = keywordToFunnelGraph(baseRule)
    const issues = validateFunnel(22, graph)
    expect(issues.some((i) => i.severity === 'error' && i.text.includes('20'))).toBe(true)
  })

  it('пустой follow-gate — предупреждение (gate считается выключенным)', () => {
    const rule: KeywordRule = { ...baseRule, messageForNonFollowers: 'ok' }
    const graph = keywordToFunnelGraph(rule)
    const gate = graph.nodes.find((n) => n.id === 'gate')!
    gate.data = { ...gate.data, messageForNonFollowers: '' }
    const issues = validateFunnel(graph.nodes.length, graph)
    expect(
      issues.some(
        (i) => i.severity === 'warning' && i.nodeId === 'gate' && i.text.includes('выключен'),
      ),
    ).toBe(true)
  })
})

describe('handle utils', () => {
  it('sourceHandle ↔ buttonIdFromHandle', () => {
    expect(buttonIdFromHandle(sourceHandle('abc123'))).toBe('abc123')
    expect(buttonIdFromHandle('gate-src')).toBeNull()
    expect(buttonIdFromHandle(null)).toBeNull()
  })
})

describe('данные шагов реагируют на правку', () => {
  it('переименование step-ноды отражается в payload', () => {
    const graph = keywordToFunnelGraph(baseRule)
    const stepNode = graph.nodes.find((n) => n.id === `step-${STEP_ID}`)!
    stepNode.data = { ...(stepNode.data as StepNodeData), name: 'Новое имя' }
    const payload = funnelGraphToSavePayload(baseRule, graph)
    expect(payload.steps[0].name).toBe('Новое имя')
  })
})
