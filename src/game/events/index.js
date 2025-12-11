/**
 * 事件系统模块
 * Events Module
 * 
 * 统一管理游戏中的所有事件：
 * - 内部事件：做菜过程中触发（厨具损坏、食材掉落等）
 * - 外部事件：随时可能触发（小偷、乞丐、虫子等）
 */

// ========== 类型定义 ==========
export {
  EventCategory,
  ExternalEventMode,
  InternalEventTypes,
  ExternalEventTypes
} from './types'

// ========== 内部事件 ==========
export {
  internalEvents,
  difficultyMultipliers,
  getDifficultyMultiplier,
  getActualProbability,
  calculateRepairCost,
  getApplianceEvents,
  getEventByStatus
} from './internalEvents'

// ========== 外部事件 ==========
export {
  externalEvents,
  getAllExternalEventIds,
  getExternalEventProbability,
  EventCategory as ExternalEventCategory  // 别名
} from './externalEvents'

// ========== 组合式函数 ==========
export { useInternalEvents, useRandomEvents } from './useInternalEvents'
export { useExternalEvents } from './useExternalEvents'

// ========== 默认导出 ==========
import { internalEvents } from './internalEvents'
import { externalEvents } from './externalEvents'
import { useInternalEvents, useRandomEvents } from './useInternalEvents'
import { useExternalEvents } from './useExternalEvents'

export default {
  internalEvents,
  externalEvents,
  useInternalEvents,
  useRandomEvents,
  useExternalEvents
}
