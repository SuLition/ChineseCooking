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
  
  // 乞丐
  beggar: {
    id: 'beggar',
    category: 'interactive',
    name: '乞丐',
    icon: '🧎',
    probability: 0,
    cooldown: 45000,
    duration: 15000,
    description: '一个衣衫褴褛的人在门口乞讨...',
    options: [
      {
        id: 'give_food',
        text: '🍚 给他一份饭',
        description: '施舍食物',
        successRate: 1,
        successResult: {
          message: '🙏 乞丐感激地离开了，好人有好报！',
          reputation: 5,     // 增加声望
          luck: 0.1,         // 临时增加幸运值
        }
      },
      {
        id: 'give_money',
        text: '💰 给他一些钱',
        description: '施舍金币',
        cost: 10,
        successRate: 1,
        successResult: {
          message: '🙏 乞丐感谢了你的慷慨！',
          reputation: 3,
        }
      },
      {
        id: 'refuse',
        text: '🚫 婉言拒绝',
        description: '不给任何东西',
        successRate: 1,
        successResult: {
          message: '😔 乞丐失望地离开了...',
          reputation: -2,
        }
      }
    ]
  },
  
  // 卫生检查员
  health_inspector: {
    id: 'health_inspector',
    category: 'interactive',
    name: '卫生检查员',
    icon: '👨‍⚕️',
    probability: 0,
    cooldown: 120000,
    duration: 20000,
    description: '卫生检查员来检查你的餐厅了！',
    // 检查项目（根据当前状态计算分数）
    checkItems: ['trash', 'cleanliness', 'ingredients'],
    options: [
      {
        id: 'accept',
        text: '✅ 接受检查',
        description: '配合检查',
        successRate: 1,  // 结果取决于检查分数
        // 结果由检查分数决定
      },
      {
        id: 'bribe',
        text: '💰 塞点好处',
        description: '尝试贿赂（花费50金币）',
        cost: 50,
        successRate: 0.6,
        successResult: {
          message: '😏 检查员收下了"茶水费"，满意地离开了',
        },
        failResult: {
          message: '😠 检查员拒绝了贿赂，加倍罚款！',
          money: -100,
        }
      }
    ]
  },
  
  // 美食评论家
  food_critic: {
    id: 'food_critic',
    category: 'interactive',
    name: '美食评论家',
    icon: '👨‍🍳',
    probability: 0,
    cooldown: 180000,
    duration: 30000,
    description: '一位著名的美食评论家来到了你的店里！',
    options: [
      {
        id: 'serve_best',
        text: '🌟 拿出看家本领',
        description: '全力以赴做最好的菜',
        successRate: 1,  // 结果取决于上菜质量
        // 需要在时限内上一道菜，根据菜品评分
      }
    ]
  },
  
  // 名人来访
  celebrity: {
    id: 'celebrity',
    category: 'interactive',
    name: '名人',
    icon: '⭐',
    probability: 0,
    cooldown: 300000,
    duration: 25000,
    description: '一位名人慕名来到你的餐厅！',
    options: [
      {
        id: 'welcome',
        text: '🎉 热情招待',
        description: '给予VIP待遇',
        successRate: 1,
        successResult: {
          message: '📸 名人对你的餐厅赞不绝口，吸引了更多顾客！',
          customerBonus: 3,  // 额外生成3个顾客
          reputation: 10,
        }
      }
    ]
  },
  
  // 供应商推销
  supplier: {
    id: 'supplier',
    category: 'interactive',
    name: '供应商',
    icon: '🚚',
    probability: 0,
    cooldown: 90000,
    duration: 20000,
    description: '一位供应商带来了特价商品！',
    // 随机生成特价商品
    generateOffers: true,
    options: [
      // 动态生成购买选项
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
  
  // 老鼠来访
  rat_visit: {
    id: 'rat_visit',
    category: 'passive',
    name: '老鼠来访',
    icon: '🐀',
    probability: 0,
    cooldown: 30000,
    description: '一只老鼠溜进了厨房',
    effect: {
      ingredientLoss: 3,
      reputationLoss: 2
    },
    messages: {
      trigger: '🐀 一只老鼠溜进了厨房，吃掉了一些食材！'
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
      pauseCooking: 3000  // 暂停烹饪3秒
    },
    messages: {
      trigger: '⚡ 突然停电了！厨具暂时无法使用！'
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
  
  // 声望影响（声望高更容易遇到好事件）
  if (eventId === 'celebrity' || eventId === 'food_critic') {
    probability *= (1 + reputation * 0.01)
  }
  
  return probability
}

export default externalEvents
