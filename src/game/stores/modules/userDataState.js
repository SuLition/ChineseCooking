/**
 * 用户数据状态模块
 * User Data State Module
 * 
 * 管理用户拥有的厨具、盘子、调料等持久化数据
 */

import { reactive } from 'vue'

/**
 * 创建用户数据状态
 */
export function createUserDataState() {
  // ========== 用户数据 ==========
  const userData = reactive({
    // 食材库存（生食材）
    ingredients: {
      vegetables: 5,
      tomato: 5,
      pumpkin: 5,
      onion: 5,
      egg: 5,
      chicken_leg: 5,
      garlic: 5,
      herbs: 5
    },
    
    // 调料库存 { bottles: 瓶数, currentAmount: 当前瓶剩余量 }
    seasonings: {
      salt: { bottles: 3, currentAmount: 100 },
      sugar: { bottles: 3, currentAmount: 100 }
    },
    
    // 拥有的厨具（ID数组）
    appliances: ['cutting_board', 'wok', 'steamer', 'mixer', 'grill', 'trash_bin'],
    
    // 盘子数量
    plates: 3
  })

  // ========== Actions ==========
  const actions = {
    // 获取用户数据
    getUserData() {
      return userData
    },
    
    // 购买厨具
    buyAppliance(applianceId, price, state, initLayout, initStates) {
      if (state.money < price) return false
      
      state.money -= price
      userData.appliances.push(applianceId)
      
      // 重新初始化布局
      if (initLayout) initLayout()
      if (initStates) initStates()
      
      return true
    },
    
    // 检查是否拥有厨具
    hasAppliance(applianceId) {
      return userData.appliances.includes(applianceId)
    },
    
    // 获取盘子数量
    getPlatesCount() {
      return userData.plates
    },
    
    // 购买盘子
    buyPlates(count, price, state) {
      if (state.money < price) return false
      
      state.money -= price
      userData.plates += count
      return true
    },
    
    // 使用盘子（上菜时消耗）
    usePlate() {
      if (userData.plates <= 0) return false
      userData.plates--
      return true
    },
    
    // 恢复盘子（顾客吃完归还）
    returnPlate() {
      userData.plates++
    }
  }

  return {
    userData,
    ...actions
  }
}
