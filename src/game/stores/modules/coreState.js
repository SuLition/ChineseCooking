/**
 * 游戏核心状态模块
 * Core Game State Module
 * 
 * 管理游戏进程、时间、经济、声望等核心状态
 */

import { reactive, computed } from 'vue'
import { gameConfig } from '../../data/config'

/**
 * 创建游戏核心状态
 */
export function createCoreState() {
  // ========== 核心状态 ==========
  const state = reactive({
    // 游戏进程状态
    isStarted: true,       // 是否已开始游戏（直接进入游戏）
    isOpen: false,         // 是否营业中
    isPaused: false,       // 是否暂停
    
    // 时间系统
    day: 1,
    hour: 7,
    minute: 0,
    
    // 经济系统
    money: 100,
    dailyEarnings: 0,
    
    // 声望与等级
    reputation: 0,
    level: 1,
    experience: 0,
    
    // 每日目标
    dailyServed: 0,
    dailyGoal: gameConfig.dailyGoals.baseCustomers,
    dailyMoneyGoal: gameConfig.dailyGoals.baseMoney,
    
    // 连击系统
    combo: 0,
    maxCombo: 0,
    
    // 升级数据
    upgrades: {
      speed: 0,
      tips: 0,
      stations: 1
    }
  })

  // ========== 计算属性 ==========
  const getters = {
    // 格式化时间显示
    formattedTime: computed(() => {
      const h = String(state.hour).padStart(2, '0')
      const m = String(state.minute).padStart(2, '0')
      return `${h}:${m}`
    }),
    
    // 目标完成进度
    goalProgress: computed(() => {
      return Math.min((state.dailyServed / state.dailyGoal) * 100, 100)
    }),
    
    // 可用烹饪台数量
    availableStations: computed(() => {
      return state.upgrades.stations + 1
    }),
    
    // 小费加成
    tipBonus: computed(() => {
      return 1 + state.upgrades.tips * gameConfig.upgrades.tips.effect
    }),
    
    // 烹饪速度加成
    speedBonus: computed(() => {
      return 1 + state.upgrades.speed * gameConfig.upgrades.speed.effect
    })
  }

  // ========== Actions ==========
  const actions = {
    // 开始游戏
    startGame() {
      state.isStarted = true
    },
    
    // 开店
    openShop() {
      state.isOpen = true
      state.hour = gameConfig.openHour
      state.minute = 0
      state.dailyServed = 0
      state.dailyEarnings = 0
    },
    
    // 打烊
    closeShop() {
      state.isOpen = false
      state.day++
    },
    
    // 更新时间
    updateTime() {
      state.minute += gameConfig.timeSpeed
      if (state.minute >= 60) {
        state.minute = 0
        state.hour++
      }
      
      // 自动打烊
      if (state.hour >= gameConfig.closeHour) {
        return false // 返回false表示应该打烊
      }
      return true
    },
    
    // 添加金币
    addMoney(amount) {
      state.money += amount
      state.dailyEarnings += amount
    },
    
    // 扣除金币
    deductMoney(amount) {
      if (state.money >= amount) {
        state.money -= amount
        return true
      }
      return false
    },
    
    // 添加声望
    addReputation(amount) {
      state.reputation += amount
      if (state.reputation < 0) state.reputation = 0
    },
    
    // 增加连击
    incrementCombo() {
      state.combo++
      if (state.combo > state.maxCombo) {
        state.maxCombo = state.combo
      }
    },
    
    // 重置连击
    resetCombo() {
      state.combo = 0
    },
    
    // 完成服务
    serveCustomer() {
      state.dailyServed++
    },
    
    // 购买升级
    buyUpgrade(type) {
      const upgrade = gameConfig.upgrades[type]
      if (!upgrade) return false
      
      const currentLevel = state.upgrades[type]
      if (currentLevel >= upgrade.maxLevel) return false
      
      const cost = upgrade.costs[currentLevel]
      if (state.money < cost) return false
      
      state.money -= cost
      state.upgrades[type]++
      return true
    }
  }

  return {
    state,
    ...getters,
    ...actions
  }
}
