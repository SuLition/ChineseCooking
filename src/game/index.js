/**
 * 游戏模块入口
 * Game Module Entry
 * 
 * 提供游戏所有功能的统一入口
 */

// 数据层
export * from './data'

// 状态存储
export { useGameStore } from './stores/gameStore'

// 游戏系统
export * from './systems'

// 事件系统
export * from './events'

// 组合式函数
export { useGame } from './composables/useGame'
export { useDragDrop } from './composables/useDragDrop'
export { useCooking } from './composables/useCooking'
export { usePlates } from './composables/usePlates'
export { useShop } from './composables/useShop'
