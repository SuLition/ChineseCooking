/**
 * Store 模块入口
 * Stores Module Entry
 * 
 * 统一导出所有 store 相关模块
 */

// 主 Store
export { useGameStore, default as gameStore } from './gameStore'

// 子模块（用于高级用法或测试）
export * from './modules'
