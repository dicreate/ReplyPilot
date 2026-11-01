import { memo, useEffect } from 'react'
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react'
import { ArrowRight, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FunnelButton, GateNodeData, StepNodeData, TriggerNodeData } from './graph'
import { sourceHandle } from './graph'

const MAX_MESSAGE = 1000
const BUTTON_TITLE_MAX = 20

export function FunnelNodeShell({
  kicker,
  icon,
  iconClass,
  title,
  selected,
  benchmarkIssue,
  children,
}: {
  kicker: string
  icon: React.ReactNode
  iconClass: string
  title: string
  selected?: boolean
  benchmarkIssue?: 'error' | 'warning' | null
  children: React.ReactNode
}) {
  return (
    <div
      className={cn('rp-node', selected && 'selected')}
      data-issue={benchmarkIssue ?? undefined}
    >
      <div className="rp-node__header">
        <span className={cn('rp-node__icon', iconClass)}>{icon}</span>
        <span className="min-w-0">
          <span className="rp-node__kicker block">{kicker}</span>
          <span className="rp-node__title block truncate" title={title}>
            {title}
          </span>
        </span>
      </div>
      <div className="rp-node__body">{children}</div>
    </div>
  )
}

function MessageBody({ message }: { message: string }) {
  const trimmed = message.trim()
  const over = message.length > MAX_MESSAGE
  return (
    <>
      <p className={cn('rp-node__message', !trimmed && 'rp-node__message--empty')}>
        {trimmed || 'Сообщение не заполнено — откройте инспектор'}
      </p>
      <p
        className={cn('rp-node__charcount', over && 'rp-node__charcount--over')}
        aria-live="polite"
      >
        {message.length}/{MAX_MESSAGE}
      </p>
    </>
  )
}

/** Хэндлы постбэк-кнопок + хэндлы входа. */
export function NodeHandles({
  kind,
  buttons,
}: {
  kind: 'trigger' | 'step'
  buttons: Array<{ id: string; title: string; type: 'url' | 'postback' }>
}) {
  const hasPostback = buttons.some((b) => b.type === 'postback')
  const postbacks = buttons.filter((b) => b.type === 'postback')
  return (
    <>
      {kind === 'step' ? (
        <Handle
          className="rp-handle rp-handle--in"
          type="target"
          position={Position.Left}
          role="button"
          aria-label="вход шага"
        />
      ) : null}
      {/* Служебный хэндл для гейт-ребра trigger → gate (edge-gate, sourceHandle 'gate-src').
          Невидимый и неинтерактивный: соединение создаётся кнопкой «Follow-gate». */}
      {kind === 'trigger' ? (
        <Handle
          id="gate-src"
          className="rp-handle rp-handle--gate"
          type="source"
          position={Position.Right}
          style={{ top: 18, right: -14 }}
          isConnectableStart={false}
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}
      {postbacks.map((b, i) => (
        <Handle
          key={b.id}
          id={sourceHandle(b.id)}
          className="rp-handle"
          type="source"
          position={Position.Right}
          role="button"
          aria-label={`соединить кнопку ${b.title || 'без названия'}`}
          style={{ top: `calc(55% + ${i * 20 - (hasPostback ? 10 : 0)}px)` }}
        />
      ))}
    </>
  )
}

/**
 * Сообщает React Flow об изменении набора хэндлов ноды.
 * Без этого кнопки, добавленные через инспектор после загрузки канвы,
 * не регистрируются во внутренних измерениях RF — соединение от такого
 * хэндла заканчивается ничем (рёбра появлялись только после перезагрузки).
 */
function useFunnelHandlesSync(nodeId: string, buttons: FunnelButton[]) {
  const updateNodeInternals = useUpdateNodeInternals()
  const signature = buttons.map((b) => `${b.type === 'postback' ? `out-${b.id}` : `url-${b.id}`}`).join('|')
  useEffect(() => {
    updateNodeInternals(nodeId)
  }, [signature, nodeId, updateNodeInternals])
}

/* =============== Trigger =============== */

export const TriggerNode = memo(({ id, data, selected }: NodeProps) => {
  const d = data as TriggerNodeData
  useFunnelHandlesSync(id, d.buttons)
  const postbacks = d.buttons.filter((b) => b.type === 'postback')
  const urls = d.buttons.filter((b) => b.type === 'url')

  return (
    <FunnelNodeShell
      kicker="Триггер · комментарий"
      icon="⚡"
      iconClass="rp-node__icon--trigger"
      title={d.keyword || 'ключевое слово'}
      selected={selected}
    >
      <MessageBody message={d.message} />
      {(postbacks.length > 0 || urls.length > 0) && (
        <div className="rp-node__buttons">
          {postbacks.map((b) => (
            <span key={b.id} className="rp-btn-row">
              <span className="rp-btn-chip rp-btn-chip--postback">
                <span className="rp-btn-chip__text">{b.title || '(без названия)'}</span>
              </span>
              <ArrowRight className="rp-btn-chip__arrow size-3" aria-hidden="true" />
            </span>
          ))}
          {urls.map((b) => (
            <span key={b.id} className="rp-btn-row">
              <span className="rp-btn-chip">
                <Link2 className="size-3 shrink-0" aria-hidden="true" />
                <span className="rp-btn-chip__text">{b.title || 'ссылка'}</span>
              </span>
            </span>
          ))}
        </div>
      )}
      <NodeHandles kind="trigger" buttons={d.buttons} />
    </FunnelNodeShell>
  )
})
TriggerNode.displayName = 'TriggerNode'

/* =============== Step =============== */

export const StepNode = memo(({ id, data, selected }: NodeProps) => {
  const d = data as StepNodeData
  useFunnelHandlesSync(id, d.buttons)
  const postbacks = d.buttons.filter((b) => b.type === 'postback')
  const urls = d.buttons.filter((b) => b.type === 'url')

  return (
    <FunnelNodeShell
      kicker="Шаг воронки"
      icon="💬"
      iconClass="rp-node__icon--step"
      title={d.name || 'Без названия'}
      selected={selected}
    >
      <MessageBody message={d.message} />
      {(postbacks.length > 0 || urls.length > 0) && (
        <div className="rp-node__buttons">
          {postbacks.map((b) => (
            <span key={b.id} className="rp-btn-row">
              <span className="rp-btn-chip rp-btn-chip--postback">
                <span className="rp-btn-chip__text">{b.title || '(без названия)'}</span>
              </span>
              <span
                className={cn(
                  'rp-btn-chip__arrow',
                  b.targetStepId ? 'text-primary' : 'text-destructive',
                )}
                title={b.targetStepId ? 'Связан' : 'Не соединён с шагом'}
              >
                <ArrowRight className="size-3" aria-hidden="true" />
              </span>
            </span>
          ))}
          {urls.map((b) => (
            <span key={b.id} className="rp-btn-row">
              <span className="rp-btn-chip">
                <Link2 className="size-3 shrink-0" aria-hidden="true" />
                <span className="rp-btn-chip__text">{b.title || 'ссылка'}</span>
              </span>
            </span>
          ))}
        </div>
      )}
      <NodeHandles kind="step" buttons={d.buttons} />
    </FunnelNodeShell>
  )
})
StepNode.displayName = 'StepNode'

/* =============== Gate =============== */

export const GateNode = memo(({ data, selected }: NodeProps) => {
  const d = data as GateNodeData
  return (
    <FunnelNodeShell
      kicker="Follow-gate · не подписан"
      icon="🔒"
      iconClass="rp-node__icon--gate"
      title={d.followButtonText || 'Я подписался'}
      selected={selected}
    >
      {/* Служебный target-хэндл для гейт-ребра (edge-gate). Невидим, некликабелен. */}
      <Handle
        className="rp-handle rp-handle--gate"
        type="target"
        position={Position.Left}
        style={{ top: 18, left: -14 }}
        aria-hidden="true"
        tabIndex={-1}
      />
      <p className={cn('rp-node__message', !d.messageForNonFollowers.trim() && 'rp-node__message--empty')}>
        {d.messageForNonFollowers.trim() || 'Сообщение для неподписанных не заполнено'}
      </p>
      <p className="rp-node__charcount">{d.messageForNonFollowers.length}/1000</p>
      {d.enableFollowCheckButton && (
        <div className="rp-node__buttons">
          <span className="rp-btn-chip w-full text-center">
            <span className="rp-btn-chip__text w-full">
              {d.followButtonText.slice(0, BUTTON_TITLE_MAX) || '✅ Я подписался'}
            </span>
          </span>
        </div>
      )}
    </FunnelNodeShell>
  )
})
GateNode.displayName = 'GateNode'

export const funnelNodeTypes = {
  trigger: TriggerNode,
  step: StepNode,
  gate: GateNode,
} as const
