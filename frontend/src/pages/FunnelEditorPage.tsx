import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import {
  AlertTriangle,
  ArrowLeft,
  CircleAlert,
  Loader2,
  Lock,
  Plus,
  Save,
  Settings2,
  TriangleAlert,
  Undo2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NodeInspector } from '@/features/funnels/NodeInspector'
import { funnelEdgeTypes } from '@/features/funnels/edges'
import { funnelNodeTypes } from '@/features/funnels/nodes'
import {
  buttonIdFromHandle,
  funnelGraphToSavePayload,
  keywordToFunnelGraph,
  newStepId,
  sourceHandle,
  validateFunnel,
  type FunnelButton,
  type FunnelEdge,
  type FunnelNode,
  type GateNodeData,
  type StepNodeData,
  type TriggerNodeData,
} from '@/features/funnels/graph'
import { keywordByIdQueryOptions, placeholdersQueryOptions } from '@/features/keywords/keywordQueries'
import { useKeywordMutations } from '@/features/keywords/useKeywordMutations'
import { recentMediaOptions } from '@/features/media/mediaQueries'
import type { PlaceholderMap } from '@/types/api'
import '../features/funnels/funnel.css'

const nodeTypes = funnelNodeTypes
const edgeTypes = funnelEdgeTypes
const defaultEdgeOptions = { type: 'smoothstep' } as const

/* ------------------------------------------------------------------ */
/* ИнNER-компонент: внутри ReactFlowProvider                           */
/* ------------------------------------------------------------------ */

function FunnelEditorInner() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const rf = useReactFlow()

  const ruleQuery = useQuery({ ...keywordByIdQueryOptions(id), retry: 0 })
  const rule = ruleQuery.data

  const placeholdersQuery = useQuery(placeholdersQueryOptions())
  const mediaQuery = useQuery(recentMediaOptions())
  const { update } = useKeywordMutations()

  const [nodes, setNodes] = useState<FunnelNode[]>([])
  const [edges, setEdges] = useState<FunnelEdge[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  /** Загруженное состояние: id правила + baseline payload + черновик из localStorage */
  const [store, setStore] = useState<{
    ruleId: string
    baseline: string
    draftPayload: Record<string, unknown> | null
  } | null>(null)

  const draftKey = `funnel-draft-${id}`

  /* ---------------- Загрузка графа: подстройка state в рендере ----------------
     (анти-паттерн effect→state; правила eslint: setState в теле эффекта запрещён) */
  const loadedRuleId = store?.ruleId ?? null
  if (rule && loadedRuleId !== rule._id) {
    const graph = keywordToFunnelGraph(rule)
    const baseline = JSON.stringify(funnelGraphToSavePayload(rule, graph))

    // Черновик: отличается от сохранённого?
    let draftPayload: Record<string, unknown> | null = null
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, unknown>
        if (JSON.stringify(saved) !== baseline) {
          draftPayload = saved
        } else {
          localStorage.removeItem(draftKey)
        }
      }
    } catch {
      localStorage.removeItem(draftKey)
    }

    setNodes(graph.nodes)
    setEdges(graph.edges)
    setSelectedId(null)
    setStore({ ruleId: rule._id, baseline, draftPayload })
  }

  const draftPayload = store?.draftPayload ?? null

  /* --------------------- Восстановление черновика --------------------- */
  const restoreDraft = useCallback(() => {
    if (!rule || !draftPayload) return
    const synthetic = { ...rule, ...draftPayload } as Parameters<typeof keywordToFunnelGraph>[0]
    const graph = keywordToFunnelGraph(synthetic)
    setNodes(graph.nodes)
    setEdges(graph.edges)
    setSelectedId(null)
    setStore((s) => (s ? { ...s, draftPayload: null } : s))
  }, [rule, draftPayload])

  const discardDraft = useCallback(() => {
    localStorage.removeItem(draftKey)
    setStore((s) => (s ? { ...s, draftPayload: null } : s))
  }, [draftKey])

  /* --------------------------- Dirty-трекинг -------------------------- */
  const payload = useMemo(
    () => (rule ? funnelGraphToSavePayload(rule, { nodes, edges }) : null),
    [rule, nodes, edges],
  )
  const dirty = payload && store ? JSON.stringify(payload) !== store.baseline : false

  const issues = useMemo(
    () => (payload ? validateFunnel(payload.steps.length + 1, { nodes, edges }) : []),
    [payload, nodes, edges],
  )
  const errors = issues.filter((i) => i.severity === 'error')
  const warningsCount = issues.length - errors.length

  /* ------------------------ Автосейв-черновик ------------------------ */
  useEffect(() => {
    if (!rule || !payload || !dirty || update.isPending) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(payload))
      } catch {
        /* переполнение localStorage игнорируем */
      }
    }, 700)
    return () => clearTimeout(t)
  }, [rule, payload, dirty, draftKey, update.isPending])

  /* ------------------------- Подгонка вида --------------------------- */
  const fitDoneRef = useRef(false)
  useEffect(() => {
    if (nodes.length > 0 && !fitDoneRef.current) {
      fitDoneRef.current = true
      requestAnimationFrame(() => rf.fitView({ padding: 0.25, duration: 300, maxZoom: 1 }))
    }
  }, [nodes.length, rf])

  /* ------------------------- Изменение канвы ------------------------- */
  /** Убирает кнопочные указатели на удалённые шаги (targetStepId). */
  const reconcilePointers = useCallback(
    (list: FunnelNode[], removedStepIds: Set<string>): FunnelNode[] =>
      list.map((n) => {
        if (n.type !== 'trigger' && n.type !== 'step') return n
        const d = n.data
        if (d.kind === 'gate') return n
        let changed = false
        const buttons = d.buttons.map((b) => {
          if (
            b.type === 'postback' &&
            b.targetStepId &&
            removedStepIds.has(b.targetStepId)
          ) {
            changed = true
            return { ...b, targetStepId: null }
          }
          return b
        })
        return changed ? { ...n, data: { ...d, buttons } } : n
      }),
    [],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nd) => applyNodeChanges(changes, nd) as FunnelNode[])
      const removed = changes.filter(
        (c): c is Extract<NodeChange, { type: 'remove' }> => c.type === 'remove',
      )
      if (removed.length === 0) return
      const removedIds = removed.map((c) => c.id)
      setNodes((nd) => {
        const removedStepIds = new Set(
          removedIds.filter((x) => x.startsWith('step-')).map((x) => x.slice('step-'.length)),
        )
        if (removedStepIds.size === 0) return nd
        return reconcilePointers(nd, removedStepIds)
      })
      setEdges((es) =>
        es.filter((e) => !removedIds.includes(e.source) && !removedIds.includes(e.target)),
      )
      setSelectedId((sid) => (sid && removedIds.includes(sid) ? null : sid))
    },
    [reconcilePointers],
  )

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((es) => applyEdgeChanges(changes, es))
    const removed = changes.filter(
      (c): c is Extract<EdgeChange, { type: 'remove' }> => c.type === 'remove',
    )
    if (removed.length === 0) return
    setNodes((nd) =>
      nd.map((n) => {
        if (n.type !== 'trigger' && n.type !== 'step') return n
        const d = n.data
        if (d.kind === 'gate') return n
        let changed = false
        const buttons = d.buttons.map((b) => {
          if (b.type === 'postback' && removed.some((r) => r.id === `edge-${n.id}-${b.id}`)) {
            changed = true
            return { ...b, targetStepId: null }
          }
          return b
        })
        return changed ? { ...n, data: { ...d, buttons } } : n
      }),
    )
  }, [])

  /** Соединение: только от хэндла постбэк-кнопки в step-ноду. */
  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target) return
    const btnId = buttonIdFromHandle(c.sourceHandle)
    if (!btnId) return

    setNodes((nd) => {
      const target = nd.find((n) => n.id === c.target)
      if (!target || target.type !== 'step') return nd
      const targetStepId = target.data.kind === 'step' ? target.data.stepId : null
      if (!targetStepId) return nd
      return nd.map((n) => {
        if (n.id !== c.source) return n
        const d = n.data
        if (d.kind === 'gate') return n
        return {
          ...n,
          data: {
            ...d,
            buttons: d.buttons.map((b) =>
              b.id === btnId ? { ...b, targetStepId, customPayload: undefined } : b,
            ),
          },
        }
      })
    })

    setEdges((es) => {
      const edgeId = `edge-${c.source}-${btnId}`
      const rest = es.filter((e) => e.id !== edgeId)
      return [
        ...rest,
        {
          id: edgeId,
          source: c.source,
          sourceHandle: c.sourceHandle,
          target: c.target,
          type: 'smoothstep',
        } as FunnelEdge,
      ]
    })
  }, [])

  /** Валидация коннекта: цель — step-нода, источник — хэндл кнопки. */
  const isValidConnection = useCallback(
    (c: Edge | Connection) => {
      if (!c.sourceHandle?.startsWith('out-') || !c.source || !c.target) return false
      if (c.source === c.target) return false
      const target = nodes.find((n) => n.id === c.target)
      return target?.type === 'step'
    },
    [nodes],
  )

  /* --------------------- Кнопки → рёбра (дифф) ----------------------- */
  const onChangeButtons = useCallback((nodeId: string, buttons: FunnelButton[]) => {
    setNodes((nd) =>
      nd.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, buttons } } : n)),
    )
    setEdges((es) => {
      // все старые рёбра-кнопки этой ноды заменяем freshly-собранными
      const kept = es.filter((e) => !(e.source === nodeId && e.sourceHandle?.startsWith('out-')))
      const fresh: FunnelEdge[] = buttons
        .filter((b) => b.type === 'postback' && b.targetStepId)
        .map((b) => ({
          id: `edge-${nodeId}-${b.id}`,
          source: nodeId,
          sourceHandle: sourceHandle(b.id),
          target: `step-${b.targetStepId}`,
          type: 'smoothstep',
        }))
      return [...kept, ...fresh]
    })
  }, [])

  /* ------------------------ Правка данных нод ------------------------ */
  const patchNode = useCallback((nodeId: string, patch: Record<string, unknown>) => {
    setNodes((nd) =>
      nd.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)),
    )
  }, [])

  const onChangeTrigger = useCallback(
    (patch: Partial<TriggerNodeData>) => patchNode('trigger', patch),
    [patchNode],
  )
  const onChangeGate = useCallback(
    (patch: Partial<GateNodeData>) => patchNode('gate', patch),
    [patchNode],
  )

  /* --------------------------- Шаги / gate --------------------------- */
  const addStep = useCallback(() => {
    const stepId = newStepId()
    const xPos = nodes.find((n) => n.type === 'trigger')?.position.x ?? 0
    const maxY = nodes
      .filter((n) => n.type === 'step')
      .reduce((m, n) => Math.max(m, n.position.y), -40)
    const node: FunnelNode = {
      id: `step-${stepId}`,
      type: 'step',
      position: { x: xPos + 360, y: Math.max(maxY + 170, 80) },
      data: { kind: 'step', stepId, name: '', message: '', buttons: [] },
    }
    setNodes((nd) => [...nd, node])
    setSelectedId(node.id)
    setSheetOpen(false)
  }, [nodes])

  const deleteStep = useCallback(
    (nodeId: string) => {
      setEdges((es) => es.filter((e) => e.source !== nodeId && e.target !== nodeId))
      setNodes((nd) => {
        const removed = nd.filter((n) => n.id === nodeId)
        const rest = nd.filter((n) => n.id !== nodeId)
        const stepIds = new Set(
          removed.flatMap((n) => (n.data.kind === 'step' ? [n.data.stepId] : [])),
        )
        return stepIds.size > 0 ? reconcilePointers(rest, stepIds) : rest
      })
      setSelectedId(null)
      setSheetOpen(false)
    },
    [reconcilePointers],
  )

  const addGate = useCallback(() => {
    if (nodes.some((n) => n.type === 'gate')) return
    const trigger = nodes.find((n) => n.type === 'trigger')
    const node: FunnelNode = {
      id: 'gate',
      type: 'gate',
      position: { x: trigger?.position.x ?? 0, y: (trigger?.position.y ?? 0) + 190 },
      data: {
        kind: 'gate',
        messageForNonFollowers: '',
        enableFollowCheckButton: true,
        followButtonText: '✅ Я подписался',
        notFollowedYetMessage: '',
      },
    }
    setNodes((nd) => [...nd, node])
    setEdges((es) => {
      if (es.some((e) => e.id === 'edge-gate')) return es
      return [
        ...es,
        {
          id: 'edge-gate',
          source: 'trigger',
          target: 'gate',
          sourceHandle: 'gate-src',
          type: 'gate-edge',
          deletable: false,
        },
      ]
    })
    setSelectedId(node.id)
  }, [nodes])

  const deleteGate = useCallback(() => {
    setNodes((nd) => nd.filter((n) => n.id !== 'gate'))
    setEdges((es) => es.filter((e) => e.id !== 'edge-gate'))
    setSelectedId(null)
    setSheetOpen(false)
  }, [])

  /* ---------------------------- Reset/Save --------------------------- */
  const resetToSaved = useCallback(() => {
    if (!rule) return
    const graph = keywordToFunnelGraph(rule)
    setNodes(graph.nodes)
    setEdges(graph.edges)
    setSelectedId(null)
    setStore((s) => ({
      ruleId: s?.ruleId ?? rule._id,
      baseline: JSON.stringify(funnelGraphToSavePayload(rule, graph)),
      draftPayload: null,
    }))
    localStorage.removeItem(draftKey)
  }, [rule, draftKey])

  const saveErrorCount = errors.length
  const onSave = async () => {
    if (!rule || !payload) return
    if (saveErrorCount > 0) {
      toast.error(`Исправьте ошибки перед сохранением: ${saveErrorCount}`)
      return
    }
    await update.mutateAsync({ id: rule._id, input: payload })
    // baseline от только что сохранённого payload
    setStore(() => ({ ruleId: rule._id, baseline: JSON.stringify(payload), draftPayload: null }))
    localStorage.removeItem(draftKey)
    void ruleQuery.refetch()
  }

  /* ------------------------- Производные ----------------------------- */
  const placeholders = placeholdersQuery.data as PlaceholderMap | undefined
  const media = mediaQuery.data ?? []
  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null

  const stepOptions = useMemo(
    () =>
      nodes
        .filter((n): n is FunnelNode & { data: StepNodeData } => n.type === 'step')
        .map((n) => ({ id: n.data.stepId, label: n.data.name || `Шаг ${n.data.stepId}` })),
    [nodes],
  )

  /* --------------------------- Состояния ----------------------------- */
  if (ruleQuery.isLoading) {
    return (
      <div className="flex h-[calc(100svh-3.5rem)] items-center justify-center md:h-svh">
        <Loader2 className="size-7 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  if (ruleQuery.isError || !rule) {
    return (
      <div className="flex h-[calc(100svh-3.5rem)] flex-col items-center justify-center gap-4 px-6 text-center md:h-svh">
        <TriangleAlert className="size-10 text-destructive" aria-hidden="true" />
        <h1 className="text-xl font-bold">Воронка не найдена</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Правило могло быть удалено из аккаунта. Вернитесь к списку и откройте другое.
        </p>
        <Button variant="outline" onClick={() => navigate('/funnels')} className="gap-2">
          <ArrowLeft className="size-4" /> К списку воронок
        </Button>
      </div>
    )
  }

  /* ------------------------------ Разметка ---------------------------- */
  const inspector = selectedNode ? (
    <NodeInspector
      node={selectedNode}
      stepOptions={stepOptions}
      placeholders={placeholders ?? {}}
      media={media}
      busy={update.isPending}
      dirty={dirty}
      errorsCount={saveErrorCount}
      onSave={onSave}
      onChangeTrigger={onChangeTrigger}
      onChangeStep={(patch) => patchNode(selectedNode.id, patch)}
      onChangeGate={onChangeGate}
      onChangeButtons={onChangeButtons}
      onDeleteStep={deleteStep}
      onDeleteGate={deleteGate}
      onAddStep={addStep}
    />
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <Settings2 className="size-8 text-muted-foreground/50" aria-hidden="true" />
      <p className="text-sm font-medium">Ничего не выбрано</p>
      <p className="max-w-[24ch] text-xs text-muted-foreground">
        Кликните ноду на канве, чтобы редактировать сообщение, кнопки и переходы.
      </p>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={addStep}>
        <Plus className="size-3.5" /> Добавить шаг
      </Button>
    </div>
  )

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col md:h-svh">
      {/* Toolbar */}
      <header className="z-10 flex min-h-14 flex-wrap items-center gap-2 border-b bg-background px-3 py-2 md:px-4">
        <Button variant="ghost" size="icon" aria-label="Назад к воронкам" onClick={() => navigate('/funnels')}>
          <ArrowLeft className="size-4" />
        </Button>

        <Badge className="max-w-40 truncate font-mono sm:max-w-56" title={rule.keyword}>
          {rule.keyword}
        </Badge>
        {dirty && <span className="size-2 rounded-full bg-amber-500" title="Есть несохранённые изменения" aria-label="Есть несохранённые изменения" />}

        {/* Issues dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <AlertTriangle className={`size-4 ${errors.length > 0 ? 'text-destructive' : 'text-amber-500'}`} />
              Проверка
              {errors.length > 0 && (
                <Badge variant="destructive">{errors.length}</Badge>
              )}
              {errors.length === 0 && warningsCount > 0 && (
                <Badge variant="secondary">{warningsCount}</Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-w-80">
            <DropdownMenuLabel>Проверка воронки</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {issues.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">Всё в порядке ✓</p>
            ) : (
              issues.map((issue, i) => (
                <DropdownMenuItem
                  key={i}
                  className="items-start gap-2"
                  disabled={!issue.nodeId}
                  onSelect={() => issue.nodeId && setSelectedId(issue.nodeId)}
                >
                  <CircleAlert
                    className={`mt-0.5 size-3.5 shrink-0 ${issue.severity === 'error' ? 'text-destructive' : 'text-amber-500'}`}
                    aria-hidden="true"
                  />
                  <span className="text-xs">{issue.text}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          {!nodes.some((n) => n.type === 'gate') && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-amber-700 dark:text-amber-400" onClick={addGate}>
              <Lock className="size-4" />
              Follow-gate
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addStep}>
            <Plus className="size-4" /> Шаг
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Отменить изменения"
            title="Вернуться к сохранённой версии"
            disabled={!dirty}
            onClick={resetToSaved}
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={update.isPending || !dirty || saveErrorCount > 0}
            title={saveErrorCount > 0 ? `Исправьте ${saveErrorCount} ошибок` : undefined}
            onClick={onSave}
          >
            {update.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Сохранить
          </Button>
        </div>
      </header>

      {/* Draft banner */}
      {draftPayload && (
        <div className="z-10 flex flex-wrap items-center gap-3 border-b bg-amber-500/10 px-4 py-2 text-xs">
          <TriangleAlert className="size-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span className="text-amber-800 dark:text-amber-300">
            Найден несохранённый черновик этой воронки.
          </span>
          <span className="ml-auto flex gap-2">
            <Button size="xs" variant="outline" onClick={restoreDraft}>
              Восстановить
            </Button>
            <Button size="xs" variant="ghost" onClick={discardDraft}>
              Отбросить
            </Button>
          </span>
        </div>
      )}

      {/* Canvas + inspector */}
      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <ReactFlow<FunnelNode, FunnelEdge>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeClick={(_, node) => {
              setSelectedId(node.id)
              setSheetOpen(false)
            }}
            onPaneClick={() => setSelectedId(null)}
            onNodeDragStop={(_, node) => {
              // фокус на редактируемую ноду после перетаскивания
              setSelectedId((sid) => sid ?? node.id)
            }}
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={1.6}
            snapToGrid
            snapGrid={[8, 8]}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.4} />
            <Controls showInteractive={false} position="bottom-left" />
          </ReactFlow>

          {/* Мобильная кнопка инспектора */}
          {selectedNode && (
            <div className="fixed inset-x-0 bottom-14 z-20 flex justify-center px-4 lg:hidden">
              <Button
                size="sm"
                className="gap-2 shadow-md"
                onClick={() => setSheetOpen(true)}
              >
                <Settings2 className="size-4" />
                Редактировать «
                {selectedNode.data.kind === 'gate'
                  ? 'Follow-gate'
                  : selectedNode.data.kind === 'trigger'
                    ? rule.keyword
                    : selectedNode.data.name || 'шаг'}
                »
              </Button>
            </div>
          )}
        </div>

        {/* Desktop inspector */}
        <aside
          className="hidden w-[360px] shrink-0 overflow-y-auto border-l bg-background lg:block"
          data-testid="funnel-inspector"
        >
          {inspector}
        </aside>

        {/* Mobile inspector */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
            <SheetHeader className="sr-only">
              <SheetTitle>Редактор ноды</SheetTitle>
            </SheetHeader>
            <div className="p-4">{inspector}</div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

export function FunnelEditorPage() {
  return (
    <ReactFlowProvider>
      <FunnelEditorInner />
    </ReactFlowProvider>
  )
}
