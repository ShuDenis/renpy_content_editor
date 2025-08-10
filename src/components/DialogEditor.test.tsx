import ReactFlow from 'reactflow'

/**
 * В React Flow нет типизированного экспорта `__rf`,
 * но тестам иногда требуется доступ к внутреннему хранилищу.
 * Используем приведение к `any`, чтобы избежать TS2614,
 * и не забывать, что этот внутренний API может измениться.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = (ReactFlow as any).__rf

export default store
