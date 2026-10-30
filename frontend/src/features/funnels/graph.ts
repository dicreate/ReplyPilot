import type { Edge, Node } from '@xyflow/react'
import type { KeywordRule, KeywordStep, RuleButton } from '@/types/api'

/* =========================== Типы графа =========================== */

export type FunnelNodeKind = 'trigger' | 'step' | 'gate'

/** Кнопка внутри ноды. `id` — локальный, при сериализации отбрасывается. */
export interface FunnelButton {
  id: string
  title: string
  type: 'url' | 'postback'
  url?: string
  /** id шага-назначения (для postback). null — ребро ещё не протянуто. */
  targetStepId?: string | null
  /** Если шаг-назначение отсутствует в графе — кастомный код (напр. STEP_DETAILS). */
  customPayload?: string
}

export interface TriggerNodeData {
  kind: 'trigger'
  keyword: string
  /** Первое сообщение (шаг 1) */
  message: string
  buttons: FunnelButton[]
  /** Пустой массив = «все посты» */
  mediaIds: string[]
  [key: string]: unknown
}

export interface StepNodeData {
  kind: 'step'
  /** Стабильный id шага, уходит в бэкенд */
  stepId: string
  name: string
  message: string
  buttons: FunnelButton[]
  [key: string]: unknown
}

export interface GateNodeData {
  kind: 'gate'
  messageForNonFollowers: string
  enableFollowCheckButton: boolean
  followButtonText: string
  notFollowedYetMessage: string
  [key: string]: unknown
}

export type FunnelNode = Node<TriggerNodeData | StepNodeData | GateNodeData, FunnelNodeKind>
export type FunnelEdge = Edge

export interface FunnelGraph {
  nodes: FunnelNode[]
  edges: FunnelEdge[]
}

export const WRONG_CHARS = /["'<>&]/

/* =========================== id-хелперы =========================== */

export const newLocalId = () =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const newStepId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const createFunnelButton = (type: 'url' | 'postback' = 'url'): FunnelButton => ({
  id: newLocalId(),
  title: '',
  type,
  url: type === 'url' ? '' : undefined,
  targetStepId: type === 'postback' ? null : undefined,
})

/** Id хэндла-источника постбэк-кнопки (по нему связываются нода и кнопка). */
export const sourceHandle = (buttonId: string) => `out-${buttonId}`
export const buttonIdFromHandle = (handleId: string | null | undefined) =>
  handleId?.startsWith('out-') ? handleId.slice('out-'.length) : null

/* ========================= Десериализация ========================= */

/**
 * Keyword из API → граф для канваса. Поддерживает данные старого формата
 * (кнопки postback с ручным payload, кастомные коды шагов).
 */
export function keywordToFunnelGraph(rule: KeywordRule): FunnelGraph {
  const nodes: FunnelNode[] = []
  const edges: FunnelEdge[] = []

  const gateEnabled = Boolean(
    (rule.messageForNonFollowers ?? '').trim() || (rule.followButtonText ?? '').trim() !== '',
  )

  const triggerNode: FunnelNode = {
    id: 'trigger',
    type: 'trigger',
    position: { x: 0, y: 160 },
    data: {
      kind: 'trigger',
      keyword: rule.keyword,
      message: rule.message ?? '',
      buttons: (rule.buttons ?? []).map((b) => ruleButtonToFunnelButton(b)),
      mediaIds: Array.isArray(rule.mediaIds) ? rule.mediaIds : [],
    },
  }
  nodes.push(triggerNode)

  let lastY = 160

  if (gateEnabled) {
    const gateNode: FunnelNode = {
      id: 'gate',
      type: 'gate',
      position: { x: 0, y: lastY + 160 },
      data: {
        kind: 'gate',
        messageForNonFollowers: rule.messageForNonFollowers ?? '',
        enableFollowCheckButton: rule.enableFollowCheckButton !== false,
        followButtonText: rule.followButtonText || '✅ Я подписался',
        notFollowedYetMessage: rule.notFollowedYetMessage ?? '',
      },
    }
    nodes.push(gateNode)
    edges.push({
      id: 'edge-gate',
      source: 'trigger',
      target: 'gate',
      sourceHandle: 'gate-src',
      type: 'gate-edge',
      deletable: false,
    })
    lastY += 160
  }

  // Шаги: раскладка колонками по глубине от триггера (BFS), чтобы кластеры не пересекались
  const steps = rule.steps ?? []
  const depth = computeStepDepths(triggerNode, steps, rule)

  steps.forEach((step, i) => {
    const d = depth.get(step.id) ?? 1
    nodes.push({
      id: `step-${step.id}`,
      type: 'step',
      position: { x: 60 + d * 320, y: 80 + (i % 6) * 150 },
      data: {
        kind: 'step',
        stepId: step.id,
        name: step.name ?? '',
        message: step.message ?? '',
        buttons: (step.buttons ?? []).map((b) => ruleButtonToFunnelButton(b)),
      },
    })
  })

  // Рёбра: из постбэк-кнопок (триггер и шаги) в целевые шаги
  pushEdgesFromButtons(triggerNode.data as TriggerNodeData, 'trigger', edges, rule)
  for (const node of nodes) {
    if (node.type !== 'step') continue
    pushEdgesFromButtons(node.data as StepNodeData, node.id, edges, rule)
  }

  layoutByDepth(nodes, edges)
  return { nodes, edges }
}

function ruleButtonToFunnelButton(b: RuleButton): FunnelButton {
  const isPostback = b.type === 'postback'
  const payload = b.payload ?? ''
  return {
    id: newLocalId(),
    title: b.title ?? '',
    type: isPostback ? 'postback' : 'url',
    url: isPostback ? undefined : (b.url ?? ''),
    targetStepId: isPostback ? null : undefined,
    customPayload: isPostback ? payload : undefined,
  }
}

/**
 * Проверяем payload кнопки на соответствие известному шагу: `STEP_<keywordId>_<stepId>`
 * (как бэкенд упаковывает) или просто stepId/name.
 */
function resolveTargetFromPayload(payload: string, rule: KeywordRule): string | null {
  if (!payload) return null
  const match = payload.match(/^STEP[_;]([0-9a-fA-F]{24})[_;](.+)$/i)
  const candidate = match ? match[2] : payload.replace(/^STEP[_:]/i, '') || payload
  const steps = rule.steps ?? []
  const found = steps.find(
    (s) => s.id === candidate || s.id === payload || s.name === candidate,
  )
  return found ? found.id : null
}

function pushEdgesFromButtons(
  data: TriggerNodeData | StepNodeData,
  nodeId: string,
  edges: FunnelEdge[],
  rule: KeywordRule,
) {
  for (const btn of data.buttons) {
    if (btn.type !== 'postback') continue
    // Target приоритетно из специального поля (новые данные), иначе — из payload (старые данные)
    const targetId = btn.targetStepId ?? resolveTargetFromPayload(btn.customPayload ?? '', rule)
    if (targetId) {
      btn.targetStepId = targetId
      btn.customPayload = undefined
      edges.push(
        makePostbackEdge(nodeId, btn, `step-${targetId}`),
      )
    }
  }
}

function makePostbackEdge(sourceId: string, btn: FunnelButton, targetId: string): FunnelEdge {
  return {
    id: `edge-${sourceId}-${btn.id}`,
    source: sourceId,
    sourceHandle: sourceHandle(btn.id),
    target: targetId,
    type: 'smoothstep',
    deletable: true,
  }
}

/** Глубина шага от триггера (BFS) — только для начальной раскладки. */
function computeStepDepths(
  triggerNode: FunnelNode,
  steps: KeywordStep[],
  rule: KeywordRule,
): Map<string, number> {
  const depth = new Map<string, number>()
  const queue: Array<{ id: string; d: number }> = []

  for (const btn of (triggerNode.data as TriggerNodeData).buttons) {
    if (btn.type === 'postback') {
      const t = resolveTargetFromPayload(btn.customPayload ?? '', rule)
      if (t) queue.push({ id: t, d: 1 })
    }
  }
  while (queue.length) {
    const { id, d } = queue.shift()!
    if (depth.has(id)) continue
    depth.set(id, d)
    const step = steps.find((s) => s.id === id)
    for (const btn of step?.buttons ?? []) {
      if (btn.type === 'postback') {
        void btn // RuleButton больше не несёт targetStepId — только payload
        const t = resolveTargetFromPayload(btn.payload ?? '', rule)
        if (t && !depth.has(t)) queue.push({ id: t, d: d + 1 })
      }
    }
  }
  return depth
}

/** Стабильная, ненаползающая раскладка: x по глубине, y — внутри колонки. */
function layoutByDepth(nodes: FunnelNode[], edges: FunnelEdge[]) {
  const depth = new Map<string, number>()
  depth.set('trigger', 0)
  const queue: Array<{ id: string; d: number }> = edges
    .filter((e) => e.source === 'trigger')
    .map((e) => ({ id: e.target, d: 1 }))

  while (queue.length) {
    const { id, d } = queue.shift()!
    if (depth.has(id)) continue
    depth.set(id, d)
    const outs = edges.filter((e) => e.source === id)
    for (const e of outs) {
      if (!depth.has(e.target)) queue.push({ id: e.target, d: d + 1 })
    }
  }

  const columns = new Map<number, FunnelNode[]>()
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 1
    n.position = { ...n.position, x: 40 + d * 330 }
    columns.set(d, [...(columns.get(d) ?? []), n])
  }
  for (const [d, list] of columns) {
    list.forEach((n, i) => {
      n.position = { x: 40 + d * 330, y: 60 + i * 170 }
    })
  }
}

/* ========================== Сериализация ========================== */

export interface FunnelSavePayload {
  keyword?: string
  message: string
  buttons: RuleButton[]
  messageForNonFollowers: string
  enableFollowCheckButton: boolean
  followButtonText: string
  notFollowedYetMessage: string
  mediaIds: string[]
  steps: KeywordStep[]
}

const toRuleButton = (btn: FunnelButton, index: number): RuleButton => {
  if (btn.type === 'postback') {
    return {
      title: btn.title.trim().slice(0, 20),
      type: 'postback',
      url: '',
      payload: (btn.targetStepId ?? btn.customPayload ?? '').trim(),
    }
  }
  return {
    title: btn.title.trim().slice(0, 20),
    type: 'url',
    url: (btn.url ?? '').trim(),
    payload: `skip_${index}`,
  }
}

/** Граф → payload PUT /api/keywords/:id. Совместим с форматом бэкенда. */
export function funnelGraphToSavePayload(rule: KeywordRule, graph: FunnelGraph): FunnelSavePayload {
  const trigger = graph.nodes.find((n) => n.type === 'trigger')
  const gate = graph.nodes.find((n) => n.type === 'gate')
  const triggerData = trigger?.data as TriggerNodeData | undefined
  const gateData = gate?.data as GateNodeData | undefined

  const buttons = (triggerData?.buttons ?? [])
    .map(toRuleButton)
    .filter((b) => b.title !== '')

  const messageForNonFollowers = gateData?.messageForNonFollowers ?? ''
  const steps: KeywordStep[] = []

  let stepIndex = 0
  for (const node of graph.nodes) {
    if (node.type !== 'step') continue
    const data = node.data as StepNodeData
    stepIndex += 1
    steps.push({
      id: data.stepId,
      name: (data.name || `Шаг ${stepIndex}`).slice(0, 100),
      message: data.message.trim(),
      buttons: data.buttons.map((b, i) => toRuleButton(b, i)).filter((b) => b.title !== ''),
    })
  }

  return {
    keyword: rule.keyword,
    message: (triggerData?.message ?? rule.message).trim(),
    buttons,
    messageForNonFollowers,
    enableFollowCheckButton: gateData ? gateData.enableFollowCheckButton : true,
    followButtonText: gateData?.followButtonText || '✅ Я подписался',
    notFollowedYetMessage: gateData?.notFollowedYetMessage ?? '',
    mediaIds: triggerData?.mediaIds ?? [],
    steps,
  }
}

/* ============================ Валидация ============================ */

export interface FunnelIssue {
  severity: 'error' | 'warning'
  nodeId?: string
  text: string
}

export function validateFunnel(nodeCount: number, graph: FunnelGraph): FunnelIssue[] {
  const issues: FunnelIssue[] = []
  const { nodes, edges } = graph

  if (nodeCount > 20) {
    issues.push({ text: `Максимум 20 шагов (сейчас ${nodeCount - 1})`, severity: 'error' })
  }

  for (const node of nodes) {
    const data = node.data
    if (node.type === 'trigger') {
      const t = data as TriggerNodeData
      if (!t.message.trim()) {
        issues.push({ severity: 'error', nodeId: node.id, text: 'Первое сообщение пустое' })
      } else if (t.message.length > 1000) {
        issues.push({ severity: 'error', nodeId: node.id, text: 'Первое сообщение > 1000 символов' })
      }
    }
    if (node.type === 'gate') {
      const g = data as GateNodeData
      if (!g.messageForNonFollowers.trim()) {
        issues.push({
          severity: 'warning',
          nodeId: node.id,
          text: 'Follow-gate выключен: сообщение для неподписанных пустое',
        })
      }
    }
    if (node.type === 'step') {
      const s = data as StepNodeData
      if (!s.message.trim()) {
        issues.push({ severity: 'error', nodeId: node.id, text: `«${s.name || 'Шаг'}»: сообщение пустое` })
      } else if (s.message.length > 1000) {
        issues.push({ severity: 'error', nodeId: node.id, text: `«${s.name || 'Шаг'}»: > 1000 символов` })
      }
      if (!edges.some((e) => e.target === node.id)) {
        issues.push({
          severity: 'warning',
          nodeId: node.id,
          text: `«${s.name || 'Шаг'}» недостижим — нет ведущего ребра`,
        })
      }
    }
    for (const btn of node.type === 'trigger' || node.type === 'step' ? (data as TriggerNodeData | StepNodeData).buttons : []) {
      if (btn.type !== 'postback') continue
      if (!btn.targetStepId && !btn.customPayload) {
        issues.push({
          severity: 'warning',
          nodeId: node.id,
          text: `Кнопка «${btn.title || 'без названия'}» не соединена с шагом`,
        })
      }
      if (btn.title.length > 20) {
        issues.push({
          severity: 'error',
          nodeId: node.id,
          text: `Кнопка «${btn.title}»: заголовок длиннее 20 символов`,
        })
      }
    }
  }

  // Циклы (A → … → A) — рекурсивная воронка, предупредим
  if (hasCycle(nodes.filter((n) => n.type === 'step').map((n) => n.id), edges)) {
    issues.push({ text: 'Обнаружен циклический переход между шагами', severity: 'warning' })
  }

  return issues
}

function hasCycle(stepIds: string[], edges: FunnelEdge[]): boolean {
  const adj = new Map<string, string[]>()
  for (const e of edges) {
    if (e.source === 'trigger' || e.target === 'gate' || e.source === 'gate') continue
    const from = e.source.replace(/^step-/, '')
    adj.set(from, [...(adj.get(from) ?? []), e.target.replace(/^step-/, '')])
  }
  const state = new Map<string, 0 | 1 | 2>()
  const dfs = (v: string): boolean => {
    const s = state.get(v)
    if (s === 1) return true
    if (s === 2) return false
    state.set(v, 1)
    for (const w of adj.get(v) ?? []) {
      if (dfs(w)) return true
    }
    state.set(v, 2)
    return false
  }
  for (const id of stepIds) if (dfs(id)) return true
  return false
}
