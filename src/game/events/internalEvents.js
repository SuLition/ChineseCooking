/**
 * 内部事件配置
 * Internal Events Configuration
 * 
 * 做菜过程中触发的事件：厨具损坏、食材掉落、盘子事件等
 */

import { InternalEventTypes } from './types'

// ========== 难度倍率配置 ==========
export const difficultyMultipliers = {
  beginner: { days: [1, 3], multiplier: 1.0 },
  easy: { days: [4, 7], multiplier: 1.2 },
  normal: { days: [8, 14], multiplier: 1.5 },
  hard: { days: [15, 21], multiplier: 1.8 },
  expert: { days: [22, Infinity], multiplier: 2.0 }
}

// ========== 内部事件配置 ==========
export const internalEvents = {
  // ========== 通用事件 ==========
  
  // 厨具损坏
  appliance_break: {
    id: 'appliance_break',
    name: '厨具损坏',
    icon: '🔧',
    probability: 0,
    cooldown: 10000,
    excludeAppliances: ['trash'],
    repairCostBase: 10,
    repairCostPerLevel: 5,
    messages: {
      trigger: '😱 {appliance}坏掉了！需要修理！',
      repair: '🔧 正在修理{appliance}...',
      done: '✅ {appliance}修好了！'
    }
  },
  
  // 食材掉落
  ingredient_drop: {
    id: 'ingredient_drop',
    name: '食材掉落',
    icon: '💨',
    probability: 0,
    cooldown: 5000,
    messages: {
      trigger: '💨 手滑了！{ingredient}掉地上了！'
    }
  },
  
  // ========== 厨具专属事件 ==========
  
  // 炒锅：锅翻了
  wok_flipped: {
    id: 'wok_flipped',
    name: '锅翻了',
    icon: '🍳',
    probability: 0,
    cooldown: 5000,
    appliance: 'wok',
    status: 'flipped',
    actionType: 'click',
    actionText: '👋 翻回来',
    actionCost: 0,
    messages: {
      trigger: '🍳 炒锅翻了！快翻回来！',
      action: '✅ 锅翻回来了！'
    }
  },
  
  // 炒锅：锅铲坏了
  wok_spatula_broken: {
    id: 'wok_spatula_broken',
    name: '锅铲坏了',
    icon: '🥄',
    probability: 0,
    cooldown: 8000,
    appliance: 'wok',
    status: 'spatula_broken',
    actionType: 'buy',
    actionText: '🛒 购买锅铲',
    actionCost: 5,
    messages: {
      trigger: '🥄 锅铲坏了！需要买新的！',
      action: '✅ 新锅铲到手！'
    }
  },
  
  // 蒸箱：爆炸了
  steamer_exploded: {
    id: 'steamer_exploded',
    name: '蒸箱爆炸',
    icon: '💥',
    probability: 0,
    cooldown: 15000,
    appliance: 'steamer',
    status: 'exploded',
    actionType: 'buy',
    actionText: '🛒 购买新蒸箱',
    actionCost: 30,
    messages: {
      trigger: '💥 蒸箱爆炸了！需要买新的！',
      action: '✅ 新蒸箱已安装！'
    }
  },
  
  // 搅拌器：抽风了
  mixer_crazy: {
    id: 'mixer_crazy',
    name: '搅拌器抽风',
    icon: '🌀',
    probability: 0,
    cooldown: 6000,
    appliance: 'mixer',
    status: 'crazy',
    actionType: 'click',
    actionText: '👊 教训它',
    actionCost: 0,
    messages: {
      trigger: '🌀 搅拌器抽风了！快制止它！',
      action: '✅ 搅拌器老实了！'
    }
  },
  
  // 烤炉：自焚了
  grill_self_burn: {
    id: 'grill_self_burn',
    name: '烤炉自焚',
    icon: '🔥',
    probability: 0,
    cooldown: 8000,
    appliance: 'grill',
    status: 'self_burn',
    actionType: 'repair',
    actionText: '🔧 修理',
    actionCost: 20,
    repairTime: 3000,
    messages: {
      trigger: '🔥 烤炉自焚了！需要修理！',
      action: '🔧 正在修理烤炉...',
      done: '✅ 烤炉修好了！'
    }
  },
  
  // ========== 盘子事件 ==========
  
  // 菜撒了
  plate_spill: {
    id: 'plate_spill',
    name: '菜撒了',
    icon: '💦',
    probability: 0,
    cooldown: 5000,
    messages: {
      trigger: '💦 手滑了！菜撒了一地！'
    }
  },
  
  // 盘子摔碎了
  plate_break: {
    id: 'plate_break',
    name: '盘子碎了',
    icon: '💥',
    probability: 0,
    cooldown: 8000,
    messages: {
      trigger: '💥 哎呀！盘子摔碎了！'
    }
  },
  
  // ========== 调料事件 ==========
  
  // 调料撒了
  seasoning_spill: {
    id: 'seasoning_spill',
    name: '调料撒了',
    icon: '🧂',
    probability: 0,
    cooldown: 6000,
    spillRatio: 0.3,
    messages: {
      trigger: '🧂 手滑了！{seasoning}撒了一些！'
    }
  }
}

// ========== 工具函数 ==========

/**
 * 获取难度倍率
 * @param {number} day - 当前天数
 * @returns {number}
 */
export function getDifficultyMultiplier(day) {
  for (const level of Object.values(difficultyMultipliers)) {
    if (day >= level.days[0] && day <= level.days[1]) {
      return level.multiplier
    }
  }
  return 1
}

/**
 * 计算实际触发概率
 * @param {string} eventId - 事件ID
 * @param {number} day - 当前天数
 * @returns {number}
 */
export function getActualProbability(eventId, day) {
  const event = internalEvents[eventId]
  if (!event) return 0
  
  const multiplier = getDifficultyMultiplier(day)
  return event.probability * multiplier
}

/**
 * 计算修理费用
 * @param {string} applianceId - 厨具ID
 * @param {number} level - 厨具等级
 * @returns {number}
 */
export function calculateRepairCost(applianceId, level = 1) {
  const event = internalEvents.appliance_break
  return event.repairCostBase + event.repairCostPerLevel * (level - 1)
}

/**
 * 获取厨具专属事件列表
 * @param {string} applianceId - 厨具ID
 * @returns {Object[]}
 */
export function getApplianceEvents(applianceId) {
  return Object.values(internalEvents).filter(e => e.appliance === applianceId)
}

/**
 * 根据状态获取事件配置
 * @param {string} status - 厨具状态
 * @returns {Object|null}
 */
export function getEventByStatus(status) {
  return Object.values(internalEvents).find(e => e.status === status) || null
}

export default internalEvents
