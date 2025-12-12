/**
 * 调试系统组合式函数
 * useDebug Composable
 * 
 * 统一管理调试功能：顾客生成、菜品生成、事件调试、状态查看等
 */

import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { getDishList } from '../data/dishes'
import { internalEvents, difficultyMultipliers } from '../events/internalEvents'
import { externalEvents } from '../events/externalEvents'

/**
 * 创建调试系统
 * @param {Object} options 配置选项
 * @param {Object} options.customerSystem - 顾客系统实例
 * @param {Object} options.soundManager - 音效管理器
 * @param {Function} options.showToast - 显示提示函数
 * @param {Object} options.randomEventsSystem - 随机事件系统（可选）
 */
export function useDebug(options) {
  const {
    customerSystem,
    soundManager,
    showToast,
    randomEventsSystem = null
  } = options

  const store = useGameStore()

  // ========== 调试状态 ==========
  const debugState = ref({
    customerSpawnEnabled: true,  // 顾客自动生成开关
    showDebugPanel: false        // 调试面板显示
  })

  // ========== 菜品列表 ==========
  const dishList = computed(() => getDishList())

  // ========== 顾客生成控制 ==========

  /**
   * 切换顾客自动生成开关
   * @returns {boolean} 当前状态
   */
  function toggleCustomerSpawn() {
    debugState.value.customerSpawnEnabled = !debugState.value.customerSpawnEnabled
    return debugState.value.customerSpawnEnabled
  }

  /**
   * 检查顾客生成是否启用
   * @returns {boolean}
   */
  function isCustomerSpawnEnabled() {
    return debugState.value.customerSpawnEnabled
  }

  // ========== 顾客调试 ==========

  /**
   * 手动生成随机顾客
   * @returns {Object|null} 生成的顾客
   */
  function debugSpawnCustomer() {
    if (!store.state.isOpen) {
      showToast?.('请先开店！', 'error')
      return null
    }
    
    const customer = customerSystem?.spawnCustomer()
    if (customer) {
      soundManager?.playCustomerArrive?.()
      showToast?.(`[调试] ${customer.icon} ${customer.name}来了`, 'success')
    }
    return customer
  }

  /**
   * 生成指定菜品的顾客
   * @param {string} dishId - 菜品ID
   * @returns {Object|null} 生成的顾客
   */
  function debugSpawnDish(dishId) {
    if (!store.state.isOpen) {
      showToast?.('请先开店！', 'error')
      return null
    }
    
    const customer = customerSystem?.spawnCustomerWithDish(dishId)
    if (customer) {
      soundManager?.playCustomerArrive?.()
      showToast?.(`[调试] 生成订单: ${customer.dishIcon} ${customer.dish}`, 'success')
    }
    return customer
  }

  /**
   * 清空所有顾客
   */
  function debugClearAllCustomers() {
    customerSystem?.clearAllCustomers()
    showToast?.('[调试] 已清空所有顾客', 'success')
  }

  /**
   * 删除指定索引的顾客
   * @param {number} index - 顾客索引
   */
  function debugRemoveCustomer(index) {
    if (index >= 0 && index < store.customers.value.length) {
      const customer = store.customers.value[index]
      customerSystem?.customerLeave(index, false)
      showToast?.(`[调试] 已移除顾客: ${customer.icon} ${customer.name}`, 'success')
    }
  }

  // ========== 金币调试 ==========

  /**
   * 增加金币
   * @param {number} amount - 金额
   */
  function debugAddMoney(amount = 100) {
    store.addMoney(amount)
    showToast?.(`[调试] +${amount} 金币`, 'money')
  }

  /**
   * 设置金币
   * @param {number} amount - 金额
   */
  function debugSetMoney(amount) {
    store.state.money = amount
    showToast?.(`[调试] 金币设为 ${amount}`, 'money')
  }

  // ========== 时间调试 ==========

  /**
   * 跳转到指定时间
   * @param {number} hour - 小时
   * @param {number} minute - 分钟
   */
  function debugSetTime(hour, minute = 0) {
    store.state.hour = hour
    store.state.minute = minute
    showToast?.(`[调试] 时间设为 ${hour}:${String(minute).padStart(2, '0')}`, 'success')
  }

  // ========== 厨具调试 ==========

  /**
   * 重置所有厨具状态
   */
  function debugResetAllAppliances() {
    Object.keys(store.applianceStates).forEach(id => {
      store.resetAppliance(id)
    })
    showToast?.('[调试] 已重置所有厨具', 'success')
  }

  // ========== 事件调试 ==========

  /**
   * 切换事件系统开关
   * @returns {boolean} 当前状态
   */
  function toggleEvents() {
    if (!randomEventsSystem) {
      showToast?.('[调试] 事件系统未初始化', 'error')
      return false
    }
    const enabled = !randomEventsSystem.eventsEnabled.value
    randomEventsSystem.setEventsEnabled(enabled)
    showToast?.(`[调试] 事件系统: ${enabled ? '开启' : '关闭'}`, enabled ? 'success' : 'error')
    return enabled
  }

  /**
   * 更新事件概率
   * @param {Object} params - { type, eventId, probability }
   */
  function updateProbability({ type, eventId, probability }) {
    if (type === 'internal' && internalEvents[eventId]) {
      internalEvents[eventId].probability = probability
      showToast?.(`[调试] ${internalEvents[eventId].name} 概率设为 ${(probability * 100).toFixed(1)}%`, 'success')
    } else if (type === 'external' && externalEvents[eventId]) {
      externalEvents[eventId].probability = probability
      showToast?.(`[调试] ${externalEvents[eventId].name} 概率设为 ${(probability * 100).toFixed(1)}%`, 'success')
    }
  }

  /**
   * 更新难度倍率
   * @param {Object} params - { level, multiplier }
   */
  function updateDifficulty({ level, multiplier }) {
    if (difficultyMultipliers[level]) {
      difficultyMultipliers[level].multiplier = multiplier
      showToast?.(`[调试] ${level} 难度倍率设为 ${multiplier}x`, 'success')
    }
  }

  /**
   * 手动触发事件
   * @param {Object} params - { type, eventId }
   */
  function triggerEvent({ type, eventId }) {
    if (type === 'internal') {
      const eventConfig = internalEvents[eventId]
      if (eventConfig) {
        showToast?.(`[调试] 触发事件: ${eventConfig.name}`, 'warning')
        console.log(`[调试] 触发内部事件: ${eventId}`)
      }
    } else if (type === 'external') {
      const eventConfig = externalEvents[eventId]
      if (eventConfig) {
        showToast?.(`[调试] 触发事件: ${eventConfig.name}`, 'warning')
        console.log(`[调试] 触发外部事件: ${eventId}`)
      }
    }
  }

  /**
   * 重置所有事件冷却
   */
  function resetCooldowns() {
    if (randomEventsSystem) {
      randomEventsSystem.resetAllCooldowns()
      showToast?.('[调试] 所有事件冷却已重置', 'success')
    }
  }

  /**
   * 获取事件系统状态
   */
  function isEventsEnabled() {
    return randomEventsSystem?.eventsEnabled?.value ?? false
  }

  // ========== 面板控制 ==========

  /**
   * 切换调试面板显示
   */
  function toggleDebugPanel() {
    debugState.value.showDebugPanel = !debugState.value.showDebugPanel
  }

  // ========== 返回接口 ==========

  return {
    // 状态
    debugState,
    dishList,

    // 顾客生成控制
    toggleCustomerSpawn,
    isCustomerSpawnEnabled,

    // 顾客调试
    debugSpawnCustomer,
    debugSpawnDish,
    debugClearAllCustomers,
    debugRemoveCustomer,

    // 金币调试
    debugAddMoney,
    debugSetMoney,

    // 时间调试
    debugSetTime,

    // 厨具调试
    debugResetAllAppliances,

    // 事件调试
    toggleEvents,
    updateProbability,
    updateDifficulty,
    triggerEvent,
    resetCooldowns,
    isEventsEnabled,

    // 面板控制
    toggleDebugPanel
  }
}

export default useDebug
