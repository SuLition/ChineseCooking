/**
 * 商店系统
 * Shop System
 */
import { reactive } from 'vue'
import { appliances, getPurchasableAppliances } from '../data/appliances'
import { ingredientCategories, getIngredientItemById, buyQuantityOptions } from '../data/shopItems'
import { rawIngredients } from '../data/ingredients'

/**
 * 创建商店系统
 * @param {Object} options - 配置项
 * @param {Object} options.gameState - 游戏状态（包含 money）
 * @param {Object} options.inventory - 库存对象
 * @param {Object} options.applianceStates - 厨具状态
 * @param {Function} options.showToast - 显示提示函数
 */
export function createShopSystem({ gameState, inventory, applianceStates, showToast }) {
  
  // ========== 食材购买 ==========
  
  /**
   * 购买食材
   * @param {string} ingredientId - 食材ID
   * @param {number} count - 数量
   * @returns {boolean} 是否购买成功
   */
  function buyIngredient(ingredientId, count = 1) {
    const item = getIngredientItemById(ingredientId)
    if (!item) {
      showToast?.('商品不存在！', 'error')
      return false
    }
    
    const totalPrice = item.price * count
    
    // 检查金币
    if (gameState.money < totalPrice) {
      showToast?.('金币不足！', 'error')
      return false
    }
    
    // 扣除金币
    gameState.money -= totalPrice
    
    // 增加库存
    if (!inventory[ingredientId]) {
      inventory[ingredientId] = 0
    }
    inventory[ingredientId] += count
    
    // 提示
    const info = rawIngredients[ingredientId]
    showToast?.(`购买了 ${count} 个 ${info?.name || item.name}`, 'money')
    
    return true
  }
  
  /**
   * 检查是否能购买食材
   * @param {number} price - 单价
   * @param {number} count - 数量
   */
  function canAffordIngredient(price, count = 1) {
    return gameState.money >= price * count
  }
  
  /**
   * 获取食材库存
   * @param {string} ingredientId - 食材ID
   */
  function getIngredientStock(ingredientId) {
    return inventory[ingredientId] || 0
  }
  
  // ========== 设备购买 ==========
  
  /**
   * 获取可购买的设备列表
   */
  function getPurchasableEquipment() {
    return getPurchasableAppliances()
  }
  
  /**
   * 检查设备是否已拥有
   * @param {string} applianceId - 厨具ID
   */
  function isApplianceOwned(applianceId) {
    return !!applianceStates[applianceId]
  }
  
  /**
   * 获取已拥有的厨具ID列表
   */
  function getOwnedApplianceIds() {
    return Object.keys(applianceStates)
  }
  
  /**
   * 购买设备
   * @param {string} applianceId - 厨具ID
   * @returns {boolean} 是否购买成功
   */
  function buyAppliance(applianceId) {
    // 检查是否已拥有
    if (isApplianceOwned(applianceId)) {
      showToast?.('已经拥有该设备！', 'error')
      return false
    }
    
    const applianceData = appliances[applianceId]
    if (!applianceData) {
      showToast?.('设备不存在！', 'error')
      return false
    }
    
    // 检查金币
    if (gameState.money < applianceData.price) {
      showToast?.('金币不足！', 'error')
      return false
    }
    
    // 扣除金币
    gameState.money -= applianceData.price
    
    // 添加厨具
    applianceStates[applianceId] = {
      ...applianceData,
      items: [],
      status: 'idle',
      progress: 0,
      resultDish: null,
      burnProgress: 0
    }
    
    showToast?.(`购买了 ${applianceData.name}`, 'money')
    return true
  }
  
  /**
   * 检查是否能购买设备
   * @param {string} applianceId - 厨具ID
   */
  function canAffordAppliance(applianceId) {
    if (isApplianceOwned(applianceId)) return false
    const applianceData = appliances[applianceId]
    if (!applianceData) return false
    return gameState.money >= applianceData.price
  }
  
  // ========== 返回接口 ==========
  
  return {
    // 数据
    ingredientCategories,
    buyQuantityOptions,
    
    // 食材相关
    buyIngredient,
    canAffordIngredient,
    getIngredientStock,
    
    // 设备相关
    getPurchasableEquipment,
    isApplianceOwned,
    getOwnedApplianceIds,
    buyAppliance,
    canAffordAppliance
  }
}

export default createShopSystem
