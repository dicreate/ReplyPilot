import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'

/** Ребро «не подписан» (trigger → gate): пунктир, янтарный, с подписью. */
export function GateEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#f59e0b',
          strokeWidth: 1.5,
          strokeDasharray: '6 4',
        }}
      />
      <EdgeLabelRenderer>
        <span
          className="rp-edge-label rp-edge-label--gate nodrag nopan absolute cursor-default"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'none',
          }}
        >
          не подписан
        </span>
      </EdgeLabelRenderer>
    </>
  )
}

export const funnelEdgeTypes = { 'gate-edge': GateEdge } as const
