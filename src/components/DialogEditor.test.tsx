import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react-dom/test-utils'

vi.mock('@core/utils', () => ({
  loadFileAsText: vi.fn(),
  saveTextFile: vi.fn()
}))

vi.mock('@core/dialogSchema', async () => {
  const actual = await vi.importActual<any>('@core/dialogSchema')
  return {
    ...actual,
    validateDialogProject: vi.fn((p: any) => p)
  }
})

vi.mock('reactflow', async () => {
  const React = await vi.importActual<any>('react')
  let onConnect: any = null
  let nodesStore: any[] = []
  let edgesStore: any[] = []
  const __rf = {
    getOnConnect: () => onConnect,
    getNodes: () => nodesStore,
    getEdges: () => edgesStore
  }
  function useNodesState(initial: any) {
    const [nodes, setNodes] = React.useState(initial)
    nodesStore = nodes
    const wrappedSet = (updater: any) => {
      setNodes((prev: any) => {
        const val = typeof updater === 'function' ? updater(prev) : updater
        nodesStore = val
        return val
      })
    }
    return [nodes, wrappedSet, () => {}]
  }
  function useEdgesState(initial: any) {
    const [edges, setEdges] = React.useState(initial)
    edgesStore = edges
    const wrappedSet = (updater: any) => {
      setEdges((prev: any) => {
        const val = typeof updater === 'function' ? updater(prev) : updater
        edgesStore = val
        return val
      })
    }
    return [edges, wrappedSet, () => {}]
  }
  const addEdge = (edge: any, edges: any[]) => [...edges, edge]
  const ReactFlowProvider = ({ children }: any) => <div>{children}</div>
  const Background = () => null
  const Controls = () => null
  const MiniMap = () => null
  function ReactFlow(props: any) {
    onConnect = props.onConnect
    return <div>{props.children}</div>
  }
  return { default: ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, __rf }
})

import DialogEditor from './DialogEditor'
import * as ReactFlowModule from 'reactflow'
import { useDialogStore } from '../store'
import { emptyDialogProject } from '@core/dialogSchema'


const __rf = (ReactFlowModule as any).__rf


describe('DialogEditor', () => {
  beforeEach(() => {
    useDialogStore.getState().resetProj(emptyDialogProject())
  })

  it('addNode adds a node to project', async () => {
    const { getByText } = render(<DialogEditor />)
    fireEvent.click(getByText('+ Узел'))
    await waitFor(() => expect(__rf.getNodes().length).toBe(1))
  })

  it('onConnect adds transition and edge', async () => {
    const { getByText } = render(<DialogEditor />)
    fireEvent.click(getByText('+ Узел'))
    fireEvent.click(getByText('+ Узел'))
    await waitFor(() => expect(__rf.getNodes().length).toBe(2))
    const [n1, n2] = __rf.getNodes()
    act(() => {
      __rf.getOnConnect()({ source: n1.id, target: n2.id })
    })
    await waitFor(() => expect(__rf.getEdges().length).toBe(1))
    expect(__rf.getEdges()[0]).toMatchObject({ source: n1.id, target: n2.id })
  })
})
