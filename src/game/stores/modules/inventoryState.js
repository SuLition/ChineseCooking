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
    
    // 获取调料库存
    getSeasoningAmount(seasoningId) {
      return userData.seasonings[seasoningId] || 0
    },
    
    // 消耗调料
    consumeSeasoning(seasoningId, amount = 10) {
      if ((userData.seasonings[seasoningId] || 0) < amount) return false
      userData.seasonings[seasoningId] -= amount
      return true
    },
    
    // 调料撒事件：减少调料容量
    spillSeasoning(seasoningId, spillAmount) {
      if (!userData.seasonings[seasoningId]) return
      userData.seasonings[seasoningId] = Math.max(0, userData.seasonings[seasoningId] - spillAmount)
    },
    
    // 购买调料
    buySeasoning(seasoningId, amount, price, state) {
      const totalCost = price
      if (state.money < totalCost) return false
      
      state.money -= totalCost
      if (userData.seasonings[seasoningId] !== undefined) {
        userData.seasonings[seasoningId] += amount
      } else {
        userData.seasonings[seasoningId] = amount
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
