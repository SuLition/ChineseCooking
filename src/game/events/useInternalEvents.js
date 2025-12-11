/**
 * 内部事件系统组合式函数
 * useInternalEvents Composable
 * 
 * 管理做菜过程中的随机事件：厨具损坏、食材掉落、盘子事件、调料事件等
 */

import { ref, reactive } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { appliances } from '../data/appliances'
import {
  internalEvents,
  getActualProbability,
  calculateRepairCost,
  getApplianceEvents
} from './internalEvents'
import { externalEvents } from './externalEvents'
import { InternalEventTypes } from './types'

// 事件类型别名（保持兼容性）
const EventTypes = InternalEventTypes

/**
 * 内部事件系统
 * @param {Object} options 配置选项
 * @param {Function} options.showToast - 显示提示函数
 * @param {Function} options.getCurrentDay - 获取当前天数函数
 * @param {Object} options.applianceStates - 厨具状态
 */
export function useInternalEvents(options) {
  const {
    showToast,
    getCurrentDay,
    applianceStates
  } = options

  const store = useGameStore()

  // ========== 事件状态 ==========
  
  // 事件冷却时间记录
  const eventCooldowns = reactive({
    [EventTypes.APPLIANCE_BREAK]: 0,
    [EventTypes.INGREDIENT_DROP]: 0,
    // 专属事件冷却
    [EventTypes.WOK_FLIPPED]: 0,
    [EventTypes.WOK_SPATULA_BROKEN]: 0,
    [EventTypes.STEAMER_EXPLODED]: 0,
    [EventTypes.MIXER_CRAZY]: 0,
    [EventTypes.GRILL_SELF_BURN]: 0,
    // 盘子事件冷却
    [EventTypes.PLATE_SPILL]: 0,
    [EventTypes.PLATE_BREAK]: 0,
    // 调料事件冷却
    [EventTypes.SEASONING_SPILL]: 0,
    // 食材事件冷却
    ingredient_bug: 0
  })
  
  // 事件是否启用
  const eventsEnabled = ref(true)
  
  // 事件统计
  const eventStats = reactive({
    applianceBreakCount: 0,
    ingredientDropCount: 0,
    specialEventCount: 0,
    plateSpillCount: 0,
    plateBreakCount: 0,
    seasoningSpillCount: 0,
    ingredientBugCount: 0
  })

  // ========== 核心函数 ==========

  /**
   * 检查事件是否在冷却中
   * @param {string} eventId - 事件ID
   * @returns {boolean}
   */
  function isEventOnCooldown(eventId) {
    const cooldownEnd = eventCooldowns[eventId] || 0
    return Date.now() < cooldownEnd
  }

  /**
   * 设置事件冷却
   * @param {string} eventId - 事件ID
   */
  function setEventCooldown(eventId) {
    // 优先查找内部事件，否则查找外部事件
    const event = internalEvents[eventId] || externalEvents[eventId]
    if (event) {
      eventCooldowns[eventId] = Date.now() + event.cooldown
    }
  }

  /**
   * 尝试触发事件（基于概率）
   * @param {string} eventId - 事件ID
   * @returns {boolean} 是否触发
   */
  function tryTriggerEvent(eventId) {
    if (!eventsEnabled.value) {
      return false
    }
    if (isEventOnCooldown(eventId)) return false
    
    const day = getCurrentDay ? getCurrentDay() : 1
    
    // 优先查找内部事件，否则查找外部事件
    const event = internalEvents[eventId] || externalEvents[eventId]
    if (!event) return false
    
    const probability = event.probability * (day * 0.1 + 0.9) // 简化的概率计算
    const roll = Math.random()
    
    return roll < probability
  }

  // ========== 厨具专属事件 ==========

  /**
   * 检查并触发厨具专属事件
   * @param {string} applianceId - 厨具ID
   * @returns {boolean} 是否触发了事件
   */
  function checkSpecialEvent(applianceId) {
    // 获取该厨具的专属事件列表
    const events = getApplianceEvents(applianceId)
    if (events.length === 0) return false
    
    // 随机检查每个事件
    for (const eventConfig of events) {
      if (tryTriggerEvent(eventConfig.id)) {
        return triggerSpecialEvent(applianceId, eventConfig)
      }
    }
    
    return false
  }

  /**
   * 触发专属事件
   * @param {string} applianceId - 厨具ID
   * @param {Object} eventConfig - 事件配置
   * @returns {boolean}
   */
  function triggerSpecialEvent(applianceId, eventConfig) {
    const appliance = applianceStates[applianceId]
    if (!appliance) return false
    
    // 设置冷却
    setEventCooldown(eventConfig.id)
    
    // 统计
    eventStats.specialEventCount++
    
    // 设置厨具状态
    appliance.status = eventConfig.status
    appliance.ingredients = []
    appliance.outputDish = null
    appliance.progress = 0
    appliance.specialEvent = eventConfig.id  // 记录当前事件
    
    // 显示提示
    showToast(eventConfig.messages.trigger, 'error')
    
    console.log(`[InternalEvent] 专属事件: ${eventConfig.name} - ${applianceId}`)
    
    return true
  }

  /**
   * 处理专属事件动作（点击修复/购买等）
   * @param {string} applianceId - 厨具ID
   * @returns {boolean}
   */
  function handleSpecialEventAction(applianceId) {
    const appliance = applianceStates[applianceId]
    if (!appliance || !appliance.specialEvent) return false
    
    const eventConfig = internalEvents[appliance.specialEvent]
    if (!eventConfig) return false
    
    const actionType = eventConfig.actionType
    const cost = eventConfig.actionCost || 0
    
    // 检查金币
    if (cost > 0 && store.state.money < cost) {
      showToast(`❌ 金币不足！需要 ${cost} 金币`, 'error')
      return false
    }
    
    // 扣除金币
    if (cost > 0) {
      store.state.money -= cost
    }
    
    if (actionType === 'click') {
      // 点击即可恢复
      resetApplianceFromEvent(applianceId)
      showToast(eventConfig.messages.action, 'success')
      return true
      
    } else if (actionType === 'buy') {
      // 购买新厨具
      resetApplianceFromEvent(applianceId)
      showToast(eventConfig.messages.action, 'success')
      return true
      
    } else if (actionType === 'repair') {
      // 需要修理
      const repairTime = eventConfig.repairTime || 3000
      appliance.status = 'repairing'
      appliance.progress = 0
      appliance.startTime = Date.now()
      appliance.processTime = repairTime
      showToast(eventConfig.messages.action, 'success')
      return true
    }
    
    return false
  }

  /**
   * 从事件中恢复厨具
   * @param {string} applianceId
   */
  function resetApplianceFromEvent(applianceId) {
    const appliance = applianceStates[applianceId]
    if (!appliance) return
    
    appliance.status = 'idle'
    appliance.ingredients = []
    appliance.outputDish = null
    appliance.progress = 0
    appliance.specialEvent = null
  }

  /**
   * 获取厨具当前事件配置
   * @param {string} applianceId
   * @returns {Object|null}
   */
  function getApplianceEventConfig(applianceId) {
    const appliance = applianceStates[applianceId]
    if (!appliance || !appliance.specialEvent) return null
    return internalEvents[appliance.specialEvent] || null
  }

  // ========== 厨具损坏事件 ==========

  /**
   * 检查厨具是否可能损坏
   * @param {string} applianceId
   * @returns {boolean}
   */
  function canApplianceBreak(applianceId) {
    const excludeList = internalEvents.appliance_break?.excludeAppliances || []
    return !excludeList.includes(applianceId)
  }

  /**
   * 检查并触发厨具损坏事件
   * @param {string} applianceId - 厨具ID
   * @returns {boolean} 是否触发了损坏
   */
  function checkApplianceBreak(applianceId) {
    // 检查厨具是否可能损坏
    if (!canApplianceBreak(applianceId)) {
      return false
    }
    
    // 检查是否在冷却中
    if (isEventOnCooldown(EventTypes.APPLIANCE_BREAK)) {
      return false
    }
    
    // 尝试触发
    if (!tryTriggerEvent(EventTypes.APPLIANCE_BREAK)) {
      return false
    }
    
    // 触发损坏
    console.log(`[InternalEvent] 触发厨具损坏: ${applianceId}`)
    return triggerApplianceBreak(applianceId)
  }

  /**
   * 强制触发厨具损坏
   * @param {string} applianceId - 厨具ID
   * @returns {boolean} 是否成功
   */
  function triggerApplianceBreak(applianceId) {
    const success = store.breakAppliance(applianceId)
    
    if (success) {
      // 设置冷却
      setEventCooldown(EventTypes.APPLIANCE_BREAK)
      
      // 统计
      eventStats.applianceBreakCount++
      
      // 提示
      const applianceData = appliances[applianceId]
      const applianceName = applianceData?.name || applianceId
      const message = internalEvents.appliance_break.messages.trigger
        .replace('{appliance}', applianceName)
      showToast(message, 'error')
      
      console.log(`[InternalEvent] 厨具损坏: ${applianceName}`)
    }
    
    return success
  }

  /**
   * 修理厨具
   * @param {string} applianceId - 厨具ID
   * @returns {boolean} 是否成功开始修理
   */
  function repairAppliance(applianceId) {
    const applianceData = appliances[applianceId]
    const level = applianceData?.level || 1
    const repairCost = calculateRepairCost(applianceId, level)
    const repairTime = 3000 // 3秒修理时间
    
    // 检查金币
    if (store.state.money < repairCost) {
      showToast(`❌ 修理费用不足！需要 ${repairCost} 金币`, 'error')
      return false
    }
    
    const success = store.startRepairingAppliance(applianceId, repairTime, repairCost)
    
    if (success) {
      const applianceName = applianceData?.name || applianceId
      const message = internalEvents.appliance_break.messages.repair
        .replace('{appliance}', applianceName)
      showToast(message, 'success')
    }
    
    return success
  }

  /**
   * 获取厨具修理费用
   * @param {string} applianceId - 厨具ID
   * @returns {number}
   */
  function getRepairCost(applianceId) {
    const applianceData = appliances[applianceId]
    const level = applianceData?.level || 1
    return calculateRepairCost(applianceId, level)
  }

  // ========== 食材掉落事件 ==========

  /**
   * 检查并触发食材掉落事件
   * @param {Object} ingredientData - 食材数据 { id, name, ... }
   * @returns {boolean} 是否触发了掉落
   */
  function checkIngredientDrop(ingredientData) {
    // 检查是否在冷却中
    if (isEventOnCooldown(EventTypes.INGREDIENT_DROP)) return false
    
    // 尝试触发
    if (!tryTriggerEvent(EventTypes.INGREDIENT_DROP)) return false
    
    // 触发掉落
    return triggerIngredientDrop(ingredientData)
  }

  /**
   * 强制触发食材掉落
   * @param {Object} ingredientData - 食材数据
   * @returns {boolean} 是否成功
   */
  function triggerIngredientDrop(ingredientData) {
    // 设置冷却
    setEventCooldown(EventTypes.INGREDIENT_DROP)
    
    // 统计
    eventStats.ingredientDropCount++
    
    // 提示
    const ingredientName = ingredientData?.name || '食材'
    const message = internalEvents.ingredient_drop.messages.trigger
      .replace('{ingredient}', ingredientName)
    showToast(message, 'error')
    
    console.log(`[InternalEvent] 食材掉落: ${ingredientName}`)
    
    return true
  }

  // ========== 盘子事件 ==========

  /**
   * 检查并触发菜撒事件（拿起盘子时）
   * @param {Object} plate - 盘子数据 { status, dish }
   * @param {number} plateIndex - 盘子索引
   * @returns {boolean} 是否触发了事件
   */
  function checkPlateSpill(plate, plateIndex) {
    // 只有有菜的盘子才可能撒
    if (!plate || plate.status !== 'hasDish') return false
    
    // 检查冷却
    if (isEventOnCooldown(EventTypes.PLATE_SPILL)) return false
    
    // 尝试触发
    if (!tryTriggerEvent(EventTypes.PLATE_SPILL)) return false
    
    // 触发撒菜事件
    return triggerPlateSpill(plate, plateIndex)
  }

  /**
   * 触发撒菜事件
   * @param {Object} plate - 盘子数据
   * @param {number} plateIndex - 盘子索引
   * @returns {boolean}
   */
  function triggerPlateSpill(plate, plateIndex) {
    // 设置冷却
    setEventCooldown(EventTypes.PLATE_SPILL)
    
    // 统计
    eventStats.plateSpillCount++
    
    // 提示
    const dishName = plate.dish?.name || '菜品'
    showToast(`💦 ${dishName}撒了一地！`, 'error')
    
    console.log(`[InternalEvent] 菜撒了: ${dishName}`)
    
    return true
  }

  /**
   * 检查并触发盘子摔碎事件（清洗过程中）
   * @param {number} plateIndex - 盘子索引
   * @returns {boolean} 是否触发了事件
   */
  function checkPlateBreak(plateIndex) {
    // 检查冷却
    if (isEventOnCooldown(EventTypes.PLATE_BREAK)) return false
    
    // 尝试触发
    if (!tryTriggerEvent(EventTypes.PLATE_BREAK)) return false
    
    // 触发摔碎事件
    return triggerPlateBreak(plateIndex)
  }

  /**
   * 触发盘子摔碎事件
   * @param {number} plateIndex - 盘子索引
   * @returns {boolean}
   */
  function triggerPlateBreak(plateIndex) {
    // 设置冷却
    setEventCooldown(EventTypes.PLATE_BREAK)
    
    // 统计
    eventStats.plateBreakCount++
    
    // 提示
    showToast(`💥 哎呀！盘子摔碎了！`, 'error')
    
    console.log(`[InternalEvent] 盘子摔碎: 索引${plateIndex}`)
    
    return true
  }

  // ========== 调料事件 ==========

  /**
   * 检查并触发调料撒事件（使用调料时）
   * @param {Object} seasoning - 调料数据 { id, name, current, max }
   * @returns {{ triggered: boolean, spillAmount: number }} 是否触发和撒掉的数量
   */
  function checkSeasoningSpill(seasoning) {
    // 检查冷却
    if (isEventOnCooldown(EventTypes.SEASONING_SPILL)) {
      return { triggered: false, spillAmount: 0 }
    }
    
    // 尝试触发
    if (!tryTriggerEvent(EventTypes.SEASONING_SPILL)) {
      return { triggered: false, spillAmount: 0 }
    }
    
    // 触发调料撒事件
    return triggerSeasoningSpill(seasoning)
  }

  /**
   * 触发调料撒事件
   * @param {Object} seasoning - 调料数据
   * @returns {{ triggered: boolean, spillAmount: number }}
   */
  function triggerSeasoningSpill(seasoning) {
    // 设置冷却
    setEventCooldown(EventTypes.SEASONING_SPILL)
    
    // 统计
    eventStats.seasoningSpillCount++
    
    // 计算撒掉的数量（30%的当前容量）
    const spillRatio = internalEvents.seasoning_spill.spillRatio || 0.3
    const spillAmount = Math.floor(seasoning.current * spillRatio)
    
    // 提示
    const seasoningName = seasoning?.name || '调料'
    const message = internalEvents.seasoning_spill.messages.trigger
      .replace('{seasoning}', seasoningName)
    showToast(message, 'error')
    
    console.log(`[InternalEvent] 调料撒了: ${seasoningName}, 撒掉${spillAmount}`)
    
    return { triggered: true, spillAmount }
  }

  // ========== 食材事件 ==========

  /**
   * 检查并触发食材被虫子吃事件
   * @param {Object} ingredient - 食材数据 { id, name }
   * @returns {boolean} 是否触发了事件
   */
  function checkIngredientBug(ingredient) {
    // 检查冷却
    if (isEventOnCooldown('ingredient_bug')) {
      return false
    }
    
    // 尝试触发
    if (!tryTriggerEvent('ingredient_bug')) {
      return false
    }
    
    // 触发虫子事件
    return triggerIngredientBug(ingredient)
  }

  /**
   * 触发食材被虫子吃事件
   * @param {Object} ingredient - 食材数据
   * @returns {boolean}
   */
  function triggerIngredientBug(ingredient) {
    // 设置冷却
    setEventCooldown('ingredient_bug')
    
    // 统计
    eventStats.ingredientBugCount++
    
    // 使用外部事件配置
    const eventConfig = externalEvents.ingredient_bug
    
    // 提示
    const ingredientName = ingredient?.name || '食材'
    const message = eventConfig.messages.trigger
      .replace('{ingredient}', ingredientName)
    showToast(message, 'error')
    
    console.log(`[InternalEvent] 食材被虫子吃了: ${ingredientName}`)
    
    return true
  }

  // ========== 系统控制 ==========

  /**
   * 启用/禁用事件系统
   * @param {boolean} enabled
   */
  function setEventsEnabled(enabled) {
    eventsEnabled.value = enabled
  }

  /**
   * 重置所有冷却时间
   */
  function resetAllCooldowns() {
    Object.keys(eventCooldowns).forEach(key => {
      eventCooldowns[key] = 0
    })
  }

  /**
   * 重置事件统计
   */
  function resetEventStats() {
    Object.keys(eventStats).forEach(key => {
      eventStats[key] = 0
    })
  }

  // ========== 返回接口 ==========
  
  return {
    // 状态
    eventsEnabled,
    eventCooldowns,
    eventStats,
    
    // 通用事件检查
    checkApplianceBreak,
    checkIngredientDrop,
    
    // 专属事件
    checkSpecialEvent,
    handleSpecialEventAction,
    getApplianceEventConfig,
    
    // 盘子事件
    checkPlateSpill,
    checkPlateBreak,
    
    // 调料事件
    checkSeasoningSpill,
    
    // 食材事件
    checkIngredientBug,
    
    // 强制触发（用于调试）
    triggerApplianceBreak,
    triggerIngredientDrop,
    triggerPlateSpill,
    triggerPlateBreak,
    triggerSeasoningSpill,
    triggerIngredientBug,
    
    // 厨具修理
    repairAppliance,
    getRepairCost,
    
    // 系统控制
    setEventsEnabled,
    resetAllCooldowns,
    resetEventStats,
    
    // 工具函数
    isEventOnCooldown
  }
}

// 兼容别名
export const useRandomEvents = useInternalEvents

export default useInternalEvents
