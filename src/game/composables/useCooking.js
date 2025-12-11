/**
 * 烹饪系统组合式函数
 * useCooking Composable
 * 
 * 管理厨具烹饪逻辑：开始烹饪、配方匹配、处理时间计算
 */

import { useGameStore } from '../stores/gameStore'
import { preparedIngredients } from '../data/ingredients'
import { findMatchingDishWithCount } from '../data/dishes'
import { appliances } from '../data/appliances'

/**
 * 烹饪系统
 * @param {Object} options - 配置选项
 * @param {Object} options.applianceStates - 厨具状态（响应式）
 * @param {Function} options.showToast - 显示提示函数
 * @param {Function} options.isShopOpen - 检查是否开店的函数
 * @returns {Object} 烹饪相关函数
 */
export function useCooking({ applianceStates, showToast, isShopOpen }) {
  
  // ========== 时间计算 ==========
  
  /**
   * 计算堆叠食材的处理时间
   * 公式：baseTime * (1 + (count - 1) * 0.4)
   * 
   * @example
   * 1个: 100%, 2个: 140%, 3个: 180%
   * 
   * @param {number} baseTime - 基础处理时间（毫秒）
   * @param {number} count - 堆叠数量
   * @returns {number} 实际处理时间（毫秒）
   */
  function calculateStackedProcessTime(baseTime, count) {
    if (count <= 1) return baseTime
    return Math.round(baseTime * (1 + (count - 1) * 0.4))
  }
  
  // ========== 烹饪流程 ==========
  
  /**
   * 开始烹饪
   * 尝试匹配菜品配方或备菜，然后开始处理
   * 
   * 配方匹配规则：
   * - 使用「最少原料」原则：以数量最少的必需食材为准
   * - 例如：3个切好的青菜 + 3个蒜末 + 2个盐 → 产出2份蒜蓉青菜
   * - 多余的食材会被舍弃
   * 
   * @param {string} applianceId - 厨具ID
   */
  function handleStartCooking(applianceId) {
    // 检查是否开店
    if (isShopOpen && !isShopOpen()) {
      showToast('❗ 请先开店再开始烹饪', 'error')
      return
    }
    
    const appliance = applianceStates[applianceId]
    if (!appliance) return
    
    // 垃圾桶特殊处理：清理垃圾
    const applianceData = appliances[applianceId]
    if (applianceData?.type === 'trash') {
      if (appliance.status !== 'hasIngredients') return
      if (!appliance.trashCount || appliance.trashCount <= 0) {
        showToast('❌ 垃圾桶是空的', 'error')
        return
      }
      const store = useGameStore()
      if (store.startEmptyingTrash(applianceId)) {
        showToast('🗑️ 正在清理垃圾桶...', 'success')
      }
      return
    }
    
    if (appliance.status !== 'hasIngredients') return
    
    // 先尝试匹配菜品配方（使用新的多份产出逻辑）
    const matchResult = findMatchingDishWithCount(appliance.ingredients, applianceId)
    
    // 准备输出数据
    let outputDish = null
    let processTime = 4000
    
    if (matchResult && matchResult.match) {
      // 匹配到菜品，使用计算出的产出数量
      const matchedDish = matchResult.dish
      const outputCount = matchResult.count
      
      outputDish = {
        id: matchedDish.id,
        name: matchedDish.name,
        icon: matchedDish.icon,
        image: matchedDish.image,
        count: outputCount  // 基于最少原料原则计算的产出数量
      }
      
      // 根据产出数量计算处理时间
      const baseTime = matchedDish.cookTime || 4000
      processTime = calculateStackedProcessTime(baseTime, outputCount)
      
      // 显示产出信息
      if (outputCount > 1) {
        showToast(`🍳 匹配到 ${matchedDish.name}，将产出 ${outputCount} 份`, 'success')
      }
    } else {
      // 尝试匹配备菜（单个生食材 + 对应厨具 -> 备菜）
      if (appliance.ingredients.length === 1) {
        const ingredient = appliance.ingredients[0]
        const ingredientCount = ingredient.count || 1  // 获取堆叠数量
        
        // 查找对应的备菜
        const matchedPrepared = Object.values(preparedIngredients).find(
          p => p.source === ingredient.id && p.appliance === applianceId
        )
        
        if (matchedPrepared) {
          const baseTime = matchedPrepared.processTime || 2000
          outputDish = {
            id: matchedPrepared.id,
            name: matchedPrepared.name,
            icon: matchedPrepared.icon,
            image: matchedPrepared.image,
            count: ingredientCount  // 保留堆叠数量
          }
          // 根据堆叠数量计算处理时间
          processTime = calculateStackedProcessTime(baseTime, ingredientCount)
        }
      }
      
      // 如果还是没有匹配，显示未知菜品（烹饪失败）
      if (!outputDish) {
        outputDish = {
          id: 'unknown',
          name: '未知菜品',
          icon: '❓',
          image: '/images/dishes/unknown.png',
          count: 1
        }
      }
    }
    
    // 开始处理
    const store = useGameStore()
    store.startProcessing(applianceId, processTime, outputDish)
    
    if (outputDish && outputDish.count > 1) {
      showToast(`🔥 开始烹饪 ${outputDish.count} 份 ${outputDish.name}...`, 'success')
    } else {
      showToast(`🔥 开始处理...`, 'success')
    }
  }
  
  // ========== 厨具管理 ==========
  
  /**
   * 清空厨具中的食材
   * 
   * @param {string} applianceId - 厨具ID
   */
  function handleClearAppliance(applianceId) {
    const store = useGameStore()
    if (store.clearAppliance(applianceId)) {
      showToast('🗑️ 已清空厨具', 'success')
    }
  }
  
  // ========== 返回接口 ==========
  
  return {
    // 时间计算
    calculateStackedProcessTime,
    
    // 烹饪流程
    handleStartCooking,
    
    // 厨具管理
    handleClearAppliance
  }
}
