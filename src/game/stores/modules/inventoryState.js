/**
 * 库存状态模块
 * Inventory State Module
 * 
 * 管理食材库存、调料、选择的食材等
 */

import { ref } from 'vue'

/**
 * 创建库存状态
 * @param {Object} userData - 用户数据引用（来自 userDataState）
 */
export function createInventoryState(userData) {
  // ========== 选择状态 ==========
  const selectedIngredients = ref([])
  
  // ========== 备菜列表 ==========
  // 处理完成的食材
  const preparedItems = ref([])

  // ========== 库存系统（指向 userData.ingredients） ==========
  const inventory = userData.ingredients

  // ========== Actions ==========
  const actions = {
    // 切换食材选择
    toggleIngredient(ingredient) {
      const idx = selectedIngredients.value.findIndex(i => i.id === ingredient.id)
      if (idx >= 0) {
        selectedIngredients.value.splice(idx, 1)
      } else if (selectedIngredients.value.length < 3) {
        selectedIngredients.value.push(ingredient)
      }
    },
    
    // 清空选择的食材
    clearSelectedIngredients() {
      selectedIngredients.value = []
    },
    
    // 获取食材库存
    getInventory(ingredientId) {
      return inventory[ingredientId] || 0
    },
    
    // 消耗食材（烹饪时调用）
    consumeIngredients(ingredientList) {
      for (const ing of ingredientList) {
        if (inventory[ing.id] !== undefined) {
          inventory[ing.id] = Math.max(0, inventory[ing.id] - ing.count)
        }
      }
    },
    
    // 购买食材
    buyIngredient(ingredientId, count, price, state) {
      const totalCost = count * price
      if (state.money < totalCost) return false
      
      state.money -= totalCost
      if (inventory[ingredientId] !== undefined) {
        inventory[ingredientId] += count
      } else {
        inventory[ingredientId] = count
      }
      return true
    },
    
    // 检查是否有足够食材做某道菜
    hasEnoughIngredients(ingredientList) {
      return ingredientList.every(ing => {
        const owned = inventory[ing.id] || 0
        return owned >= ing.count
      })
    },
    
    // 从备菜列表移除
    removePrepared(index) {
      if (index >= 0 && index < preparedItems.value.length) {
        return preparedItems.value.splice(index, 1)[0]
      }
      return null
    },
    
    // 清空备菜列表
    clearPrepared() {
      preparedItems.value = []
    },
    
    // ========== 调料操作 ==========
    
    // 获取调料库存（当前瓶剩余量）
    getSeasoningAmount(seasoningId) {
      const data = userData.seasonings[seasoningId]
      if (typeof data === 'number') return data
      if (typeof data === 'object' && data !== null) return data.currentAmount || 0
      return 0
    },
    
    // 消耗调料
    consumeSeasoning(seasoningId, amount = 1) {
      const data = userData.seasonings[seasoningId]
      if (!data) return false
      
      // 处理对象格式 { bottles, currentAmount }
      if (typeof data === 'object') {
        if ((data.currentAmount || 0) < amount) return false
        data.currentAmount -= amount
        return true
      }
      
      // 处理数字格式
      if (typeof data === 'number') {
        if (data < amount) return false
        userData.seasonings[seasoningId] -= amount
        return true
      }
      
      return false
    },
    
    // 调料撒事件：减少调料容量
    spillSeasoning(seasoningId, spillAmount) {
      const data = userData.seasonings[seasoningId]
      if (!data) return
      
      if (typeof data === 'object') {
        data.currentAmount = Math.max(0, (data.currentAmount || 0) - spillAmount)
      } else if (typeof data === 'number') {
        userData.seasonings[seasoningId] = Math.max(0, data - spillAmount)
      }
    },
    
    // 购买调料（增加瓶数）
    buySeasoning(seasoningId, amount, price, state) {
      const totalCost = price
      if (state.money < totalCost) return false
      
      state.money -= totalCost
      const data = userData.seasonings[seasoningId]
      
      if (typeof data === 'object') {
        // 对象格式：增加瓶数并补充 currentAmount
        data.bottles = (data.bottles || 0) + amount
        data.currentAmount = (data.currentAmount || 0) + amount * 100 // 每瓶100
      } else if (typeof data === 'number') {
        userData.seasonings[seasoningId] += amount * 100
      } else {
        // 初始化新调料
        userData.seasonings[seasoningId] = { bottles: amount, currentAmount: amount * 100 }
      }
      return true
    }
  }

  return {
    selectedIngredients,
    preparedItems,
    inventory,
    ...actions
  }
}
