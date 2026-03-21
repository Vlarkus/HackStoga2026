export interface GraphNode {
  id: string
  label: string
  hash: string
  type: 'commit' | 'current' | 'future'
  parents: string[]
  lane: number
  column: number
}

export interface NodePosition {
  x: number
  y: number
}

export interface GraphLayout {
  positions: Map<string, NodePosition>
  viewBoxWidth: number
  viewBoxHeight: number
}

const STEP_X = 130
const STEP_Y = 80
const PADDING_X = 56
const PADDING_Y = 56

export function computeGraphLayout(nodes: GraphNode[]): GraphLayout {
  const positions = new Map<string, NodePosition>()

  let maxColumn = 0
  let maxLane = 0

  for (const node of nodes) {
    if (node.column > maxColumn) maxColumn = node.column
    if (node.lane > maxLane) maxLane = node.lane
  }

  for (const node of nodes) {
    positions.set(node.id, {
      x: PADDING_X + node.column * STEP_X,
      y: PADDING_Y + node.lane * STEP_Y,
    })
  }

  return {
    positions,
    viewBoxWidth: PADDING_X + (maxColumn + 1) * STEP_X + PADDING_X,
    viewBoxHeight: PADDING_Y + (maxLane + 1) * STEP_Y + PADDING_Y,
  }
}
