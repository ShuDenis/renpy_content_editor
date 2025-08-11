import { useCallback, useRef, useState } from "react"

export function useUndoState<T>(initial: T, validate: (v: T) => T): [
  T,
  (value: T | ((prev: T) => T)) => void,
  (value: T) => void,
  () => void,
  () => void
] {
  const [state, setState] = useState<T>(validate(initial))
  const undoStack = useRef<T[]>([])
  const redoStack = useRef<T[]>([])

  const set = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(prev => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value
        undoStack.current.push(prev)
        redoStack.current = []
        return validate(next)
      })
    },
    [validate]
  )

  const reset = useCallback(
    (value: T) => {
      undoStack.current = []
      redoStack.current = []
      setState(validate(value))
    },
    [validate]
  )

  const undo = useCallback(() => {
    setState(current => {
      const prev = undoStack.current.pop()
      if (prev !== undefined) {
        redoStack.current.push(current)
        return prev
      }
      return current
    })
  }, [])

  const redo = useCallback(() => {
    setState(current => {
      const next = redoStack.current.pop()
      if (next !== undefined) {
        undoStack.current.push(current)
        return next
      }
      return current
    })
  }, [])

  return [state, set, reset, undo, redo]
}
