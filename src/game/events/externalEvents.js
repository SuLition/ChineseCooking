/**
 * 外部事件配置
 * External Events Configuration
 * 
 * 管理随时可能触发的外部事件
 * - interactive: 有交互事件（需要弹窗选择）
 * - passive: 无交互事件（自动发生）
 */

import { ExternalEventTypes, ExternalEventMode } from './types'

// 重新导出类型（方便外部使用）
export { ExternalEventTypes, ExternalEventMode }
export const EventCategory = ExternalEventMode  // 别名兼容

// ========== 外部事件配置 ==========
export const externalEvents = {
  // 小偷
  thief: {
    id: 'thief',
    category: 'interactive',
    name: '小偷',
    icon: '🦹',
    image: null,  // 可选：自定义图片
    probability: 0,  // 基础概率
    cooldown: 60000,    // 冷却时间（60秒）
    duration: 10000,    // 事件持续时间（10秒内必须响应）
    description: '一个鬼鬼祟祟的人在店里徘徊...',
    // 选项配置
    options: [
      {
        id: 'catch',
        text: '🚨 抓住他！',
        description: '尝试抓住小偷',
        successRate: 0.7,  // 成功率70%
        successResult: {
          message: '✅ 成功抓住了小偷！获得奖励！',
          money: 50,       // 获得金币
        },
        failResult: {
          message: '❌ 小偷逃跑了，还顺走了一些东西...',
          money: -30,      // 损失金币
        }
      },
      {
        id: 'ignore',
        text: '👀 假装没看见',
        description: '忽略他',
        successRate: 1,
        successResult: {
          message: '😅 小偷偷走了一些食材...',
          ingredientLoss: 2,  // 损失2个随机食材
        }
      }
    ]
  },
  
  // ========== 无交互事件 ==========
  
  // 虫子吃食材
  ingredient_bug: {
    id: 'ingredient_bug',
    category: 'passive',
    name: '虫子吃食材',
    icon: '🐛',
    probability: 0,
    cooldown: 5000,
    description: '虫子吃掉了一个食材',
    effect: {
      ingredientLoss: 1
    },
    messages: {
      trigger: '🐛 糟糕！{ingredient}被虫子吃掉了一个！'
    }
  },
  
  
  // 短暂停电
  power_outage: {
    id: 'power_outage',
    category: 'passive',
    name: '短暂停电',
    icon: '⚡',
    probability: 0,
    cooldown: 60000,
    description: '突然停电了',
    effect: {
      pauseCooking: 10000  // 暂停烹饪10秒
    },
    messages: {
      trigger: '⚡ 突然停电了！厨具暂时无法使用！'
    }
  },
  
  // 网红来了
  influencer: {
    id: 'influencer',
    category: 'passive',
    name: '网红来了',
    icon: '📱',
    probability: 0,
    cooldown: 300000,  // 5分钟冷却
    description: '一位网红正在直播你的餐厅！',
    effect: {
      customerBoost: 300000  // 顾客激增持续300秒
    },
    messages: {
      trigger: '📱 网红来了！顾客量激增中...',
      end: '📱 网红离开了，顾客流量恢复正常'
    }
  }
}

// ========== 工具函数 ==========

/**
 * 获取外部事件配置
 * @param {string} eventId - 事件ID
 * @returns {Object|null}
 */
export function getExternalEvent(eventId) {
  return externalEvents[eventId] || null
}

/**
 * 获取所有外部事件ID列表
 * @returns {string[]}
 */
export function getAllExternalEventIds() {
  return Object.keys(externalEvents)
}

/**
 * 计算外部事件实际概率
 * @param {string} eventId - 事件ID
 * @param {number} day - 当前天数
 * @param {number} reputation - 当前声望
 * @returns {number}
 */
export function getExternalEventProbability(eventId, day, reputation = 0) {
  const event = externalEvents[eventId]
  if (!event) return 0
  
  // 基础概率
  let probability = event.probability
  
  // 天数加成（每天增加5%）
  const dayMultiplier = 1 + (day - 1) * 0.05
  probability *= Math.min(dayMultiplier, 2)  // 最多2倍
  
  return probability
}

export default externalEvents
