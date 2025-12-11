/**
 * 外部事件系统组合式函数
 * useExternalEvents Composable
 * 
 * 管理随机来访者事件的触发、显示和处理
 */

import { ref, reactive, computed } from 'vue'
import { 
  externalEvents, 
  getAllExternalEventIds,
  getExternalEventProbability,
  EventCategory
} from './externalEvents'
import { rawIngredients } from '../data/ingredients'

/**
 * 外部事件系统
 * @param {Object} options 配置选项
 * @param {Function} options.showToast - 显示提示函数
 * @param {Function} options.getCurrentDay - 获取当前天数
 * @param {Function} options.getReputation - 获取当前声望
 * @param {Object} options.store - 游戏状态store
 */
export function useExternalEvents(options) {
  const {
    showToast,
    getCurrentDay,
    getReputation = () => 0,
    store
  } = options

  // ========== 状态 ==========
  
  // 当前活动的外部事件
  const activeEvent = ref(null)
  
  // 事件剩余时间（毫秒）
  const eventTimeLeft = ref(0)
  
  // 事件冷却记录
  const eventCooldowns = reactive({})
  
  // 事件统计
  const eventStats = reactive({
    totalEvents: 0,
    eventsHandled: {},  // { eventId: count }
  })
  
  // 被虫子吃的食材ID（用于动画）
  const bugEatenIngredientId = ref(null)
  
  // 系统是否启用
  const isEnabled = ref(true)
  
  // 事件倒计时定时器
  let countdownTimer = null

  // ========== 计算属性 ==========
  
  // 是否有活动事件
  const hasActiveEvent = computed(() => activeEvent.value !== null)
  
  // 事件剩余时间（秒）
  const eventTimeLeftSeconds = computed(() => Math.ceil(eventTimeLeft.value / 1000))

  // ========== 核心函数 ==========

  /**
   * 检查是否在冷却中
   * @param {string} eventId
   * @returns {boolean}
   */
  function isOnCooldown(eventId) {
    const cooldownEnd = eventCooldowns[eventId] || 0
    return Date.now() < cooldownEnd
  }

  /**
   * 设置冷却时间
   * @param {string} eventId
   */
  function setCooldown(eventId) {
    const event = externalEvents[eventId]
    if (event) {
      eventCooldowns[eventId] = Date.now() + event.cooldown
    }
  }

  /**
   * 尝试触发随机外部事件
   * @returns {boolean} 是否触发了事件
   */
  function tryTriggerEvent() {
    if (!isEnabled.value) return false
    if (hasActiveEvent.value) return false  // 已有活动事件
    
    const day = getCurrentDay ? getCurrentDay() : 1
    const reputation = getReputation ? getReputation() : 0
    
    // 遍历所有事件，检查是否触发
    const eventIds = getAllExternalEventIds()
    
    for (const eventId of eventIds) {
      if (isOnCooldown(eventId)) continue
      
      const eventConfig = externalEvents[eventId]
      const probability = getExternalEventProbability(eventId, day, reputation)
      const roll = Math.random()
      
      if (roll < probability) {
        // 根据事件类型处理
        if (eventConfig.category === EventCategory.INTERACTIVE) {
          // 有交互事件：显示弹窗
          triggerInteractiveEvent(eventId)
        } else {
          // 无交互事件：直接执行效果
          triggerPassiveEvent(eventId)
        }
        return true
      }
    }
    
    return false
  }

  /**
   * 触发有交互事件（显示弹窗）
   * @param {string} eventId
   */
  function triggerInteractiveEvent(eventId) {
    const eventConfig = externalEvents[eventId]
    if (!eventConfig) return
    
    // 设置冷却
    setCooldown(eventId)
    
    // 设置活动事件
    activeEvent.value = {
      ...eventConfig,
      startTime: Date.now(),
      endTime: Date.now() + eventConfig.duration
    }
    
    // 设置剩余时间
    eventTimeLeft.value = eventConfig.duration
    
    // 启动倒计时
    startCountdown()
    
    // 统计
    eventStats.totalEvents++
    eventStats.eventsHandled[eventId] = (eventStats.eventsHandled[eventId] || 0) + 1
    
    // 显示提示
    showToast(`${eventConfig.icon} ${eventConfig.name}来了！`, 'warning')
    
    console.log(`[ExternalEvent] 有交互事件: ${eventConfig.name}`)
  }

  /**
   * 触发无交互事件（直接执行效果）
   * @param {string} eventId
   */
  function triggerPassiveEvent(eventId) {
    const eventConfig = externalEvents[eventId]
    if (!eventConfig) return
    
    // 设置冷却
    setCooldown(eventId)
    
    // 统计
    eventStats.totalEvents++
    eventStats.eventsHandled[eventId] = (eventStats.eventsHandled[eventId] || 0) + 1
    
    // 执行效果
    applyPassiveEventEffect(eventConfig)
    
    console.log(`[ExternalEvent] 无交互事件: ${eventConfig.name}`)
  }

  /**
   * 执行无交互事件效果
   * @param {Object} eventConfig
   */
  function applyPassiveEventEffect(eventConfig) {
    const effect = eventConfig.effect || {}
    
    // 食材损失
    if (effect.ingredientLoss && store) {
      const lostIngredient = loseRandomIngredients(effect.ingredientLoss)
      
      // 如果是虫子事件，触发动画
      if (eventConfig.id === 'ingredient_bug' && lostIngredient) {
        bugEatenIngredientId.value = lostIngredient.id
        setTimeout(() => {
          bugEatenIngredientId.value = null
        }, 800)
        
        // 显示带食材名称的消息
        const message = eventConfig.messages?.trigger?.replace('{ingredient}', lostIngredient.name)
        showToast(message || `${eventConfig.icon} ${eventConfig.description}`, 'error')
      } else {
        showToast(eventConfig.messages?.trigger || `${eventConfig.icon} ${eventConfig.description}`, 'error')
      }
    } else {
      // 显示默认消息
      showToast(eventConfig.messages?.trigger || `${eventConfig.icon} ${eventConfig.description}`, 'error')
    }
    
    // 声望损失
    if (effect.reputationLoss && store) {
      store.state.reputation = Math.max(0, (store.state.reputation || 0) - effect.reputationLoss)
    }
    
    // 暂停烹饪（停电事件）
    if (effect.pauseCooking) {
      // TODO: 实现暂停烹饪逻辑
    }
  }

  /**
   * 启动倒计时
   */
  function startCountdown() {
    stopCountdown()
    
    countdownTimer = setInterval(() => {
      if (!activeEvent.value) {
        stopCountdown()
        return
      }
      
      eventTimeLeft.value = Math.max(0, activeEvent.value.endTime - Date.now())
      
      // 时间到，自动处理（超时）
      if (eventTimeLeft.value <= 0) {
        handleTimeout()
      }
    }, 100)
  }

  /**
   * 停止倒计时
   */
  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  /**
   * 处理超时
   */
  function handleTimeout() {
    if (!activeEvent.value) return
    
    const event = activeEvent.value
    showToast(`⏰ ${event.name}等不及离开了...`, 'error')
    
    // 根据事件类型处理超时后果
    applyTimeoutPenalty(event)
    
    // 清除事件
    clearEvent()
  }

  /**
   * 应用超时惩罚
   * @param {Object} event
   */
  function applyTimeoutPenalty(event) {
    switch (event.id) {
      case 'thief':
        // 小偷超时 = 偷东西跑了
        if (store) {
          store.state.money = Math.max(0, store.state.money - 50)
        }
        showToast('💸 小偷趁乱偷走了50金币！', 'error')
        break
        
      case 'health_inspector':
        // 卫生检查超时 = 直接罚款
        if (store) {
          store.state.money = Math.max(0, store.state.money - 80)
        }
        showToast('📋 因不配合检查，被罚款80金币！', 'error')
        break
        
      default:
        // 其他事件超时没有特殊惩罚
        break
    }
  }

  /**
   * 选择事件选项
   * @param {string} optionId - 选项ID
   * @returns {Object} 结果
   */
  function selectOption(optionId) {
    if (!activeEvent.value) return { success: false }
    
    const event = activeEvent.value
    const option = event.options.find(o => o.id === optionId)
    
    if (!option) return { success: false }
    
    // 检查费用
    if (option.cost && store) {
      if (store.state.money < option.cost) {
        showToast('❌ 金币不足！', 'error')
        return { success: false, reason: 'not_enough_money' }
      }
      store.state.money -= option.cost
    }
    
    // 计算成功/失败
    const roll = Math.random()
    const isSuccess = roll < option.successRate
    
    // 应用结果
    const result = isSuccess ? option.successResult : option.failResult
    if (result) {
      applyResult(result)
    }
    
    // 清除事件
    clearEvent()
    
    return { 
      success: true, 
      isSuccess, 
      result,
      message: result?.message || ''
    }
  }

  /**
   * 应用事件结果
   * @param {Object} result
   */
  function applyResult(result) {
    if (!result) return
    
    // 显示消息
    if (result.message) {
      const type = result.money > 0 || result.reputation > 0 ? 'success' : 
                   result.money < 0 || result.reputation < 0 ? 'error' : 'info'
      showToast(result.message, type)
    }
    
    if (!store) return
    
    // 金币变化
    if (result.money) {
      store.state.money = Math.max(0, store.state.money + result.money)
    }
    
    // 声望变化
    if (result.reputation) {
      store.state.reputation = (store.state.reputation || 0) + result.reputation
    }
    
    // 食材损失
    if (result.ingredientLoss) {
      loseRandomIngredients(result.ingredientLoss)
    }
    
    // 额外顾客
    if (result.customerBonus) {
      // 需要在外部处理
    }
    
    // 幸运加成
    if (result.luck) {
      store.state.luckBonus = (store.state.luckBonus || 0) + result.luck
    }
  }

  /**
   * 随机损失食材
   * @param {number} count
   * @returns {Object|null} 返回损失的食材信息
   */
  function loseRandomIngredients(count) {
    if (!store) return null
    
    const inventory = store.inventory
    const availableIngredients = Object.entries(inventory)
      .filter(([id, amount]) => amount > 0 && rawIngredients[id])
      .map(([id, amount]) => ({ id, amount, ...rawIngredients[id] }))
    
    if (availableIngredients.length === 0) return null
    
    let lostIngredient = null
    
    for (let i = 0; i < count && availableIngredients.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableIngredients.length)
      const ingredient = availableIngredients[randomIndex]
      
      if (inventory[ingredient.id] > 0) {
        inventory[ingredient.id]--
        if (i === 0) lostIngredient = ingredient  // 记录第一个损失的食材
      }
    }
    
    return lostIngredient
  }

  /**
   * 清除当前事件
   */
  function clearEvent() {
    activeEvent.value = null
    eventTimeLeft.value = 0
    stopCountdown()
  }

  /**
   * 启用/禁用系统
   * @param {boolean} enabled
   */
  function setEnabled(enabled) {
    isEnabled.value = enabled
    if (!enabled) {
      clearEvent()
    }
  }

  /**
   * 重置所有冷却
   */
  function resetAllCooldowns() {
    Object.keys(eventCooldowns).forEach(key => {
      eventCooldowns[key] = 0
    })
  }

  // ========== 返回接口 ==========
  
  return {
    // 状态
    activeEvent,
    eventTimeLeft,
    eventTimeLeftSeconds,
    hasActiveEvent,
    isEnabled,
    eventStats,
    bugEatenIngredientId,
    
    // 事件触发
    tryTriggerEvent,
    triggerInteractiveEvent,
    triggerPassiveEvent,
    
    // 事件处理
    selectOption,
    clearEvent,
    
    // 系统控制
    setEnabled,
    resetAllCooldowns,
    isOnCooldown,
  }
}

export default useExternalEvents
