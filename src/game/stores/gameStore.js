/**
 * 游戏状态存储
 * Game State Store
 * 
 * 使用 Vue 响应式 API 实现简单状态管理
 */

import { reactive, ref, computed } from 'vue'
import { gameConfig } from '../data/config'
import { appliances } from '../data/appliances'

// ========== 游戏核心状态 ==========
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

// ========== 顾客状态 ==========
const customers = ref([])
const selectedCustomerIndex = ref(-1)

// ========== 烹饪状态 ==========
const cookingState = reactive({
  currentCustomer: null,
  hint: '选择一位顾客开始烹饪'
})

// ========== 选择状态 ==========
const selectedIngredients = ref([])

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
  
  // 拥有的厨具（ID数组，用户可以拥有多个同类型厨具）
  appliances: ['cutting_board', 'wok', 'steamer', 'mixer', 'grill'],
  
  // 盘子数量
  plates: 3
})

// ========== 库存系统（兼容旧代码，指向 userData.ingredients） ==========
const inventory = userData.ingredients

// ========== 厨具状态 ==========
// 每个厨具的状态：空闲/处理中/完成/烧糊/清理中
const applianceStates = reactive({})

// 用户的厨具布局配置（基于 userData.appliances 动态生成）
const userApplianceLayout = ref([])

// 网格布局常量
const GRID_COLS = 10
const GRID_ROWS = 5

// 根据用户拥有的厨具初始化布局
function initUserApplianceLayout() {
  const layouts = []
  let currentRow = 1
  let currentCol = 1
  
  userData.appliances.forEach((appId) => {
    // 从 appliances 数据中读取正确的 gridSize
    const applianceData = appliances[appId]
    const gridSize = applianceData?.gridSize || { cols: 2, rows: 2 }
    const width = gridSize.cols
    const height = gridSize.rows
    
    // 检查当前行是否能容纳这个厨具
    if (currentCol + width - 1 > GRID_COLS) {
      // 换行
      currentRow += getMaxHeightInRow(layouts, currentRow)
      currentCol = 1
    }
    
    // 检查是否超出行边界
    if (currentRow + height - 1 > GRID_ROWS) {
      console.warn(`厨具 ${appId} 无法放置，超出网格边界`)
      return
    }
    
    layouts.push({
      id: appId,
      row: currentRow,
      col: currentCol,
      width: width,
      height: height
    })
    
    currentCol += width
  })
  
  userApplianceLayout.value = layouts
}

// 获取某一行中最大的厨具高度
function getMaxHeightInRow(layouts, row) {
  let maxHeight = 0
  layouts.forEach(app => {
    if (app.row === row) {
      maxHeight = Math.max(maxHeight, app.height)
    }
  })
  return maxHeight || 1
}

// 初始化厨具状态
function initApplianceStates() {
  userApplianceLayout.value.forEach(app => {
    if (!applianceStates[app.id]) {
      applianceStates[app.id] = {
        status: 'idle',           // idle/hasIngredients/processing/done/burned/cleaning
        ingredients: [],          // 已放入的食材列表 [{id, type, icon, name, image}]
        outputDish: null,         // 产出的成品菜 {id, name, icon, image}
        progress: 0,              // 处理进度 0-100
        burnProgress: 0,          // 烧焦进度 0-100
        burnTimer: 0,             // 烧焦计时器
        startTime: 0,             // 开始处理时间
        processTime: 0            // 处理时长
      }
    }
  })
}

// 初始化布局和厨具状态
initUserApplianceLayout()
initApplianceStates()

// ========== 备菜列表 ==========
// 处理完成的食材
const preparedItems = ref([])

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
  
  // 当前选中的顾客
  selectedCustomer: computed(() => {
    if (selectedCustomerIndex.value >= 0 && selectedCustomerIndex.value < customers.value.length) {
      return customers.value[selectedCustomerIndex.value]
    }
    return null
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
    customers.value = []
    selectedCustomerIndex.value = -1
    state.dailyServed = 0
    state.dailyEarnings = 0
  },
  
  // 打烊
  closeShop() {
    state.isOpen = false
    customers.value = []
    selectedCustomerIndex.value = -1
    cookingState.currentCustomer = null
    cookingState.isActive = false
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
  
  // 添加顾客
  addCustomer(customer) {
    if (customers.value.length < gameConfig.maxCustomers) {
      customers.value.push(customer)
      return true
    }
    return false
  },
  
  // 移除顾客
  removeCustomer(index) {
    if (index >= 0 && index < customers.value.length) {
      customers.value.splice(index, 1)
      
      // 更新选中索引
      if (selectedCustomerIndex.value === index) {
        selectedCustomerIndex.value = -1
        cookingState.currentCustomer = null
      } else if (selectedCustomerIndex.value > index) {
        selectedCustomerIndex.value--
      }
    }
  },
  
  // 选择顾客
  selectCustomer(index) {
    selectedCustomerIndex.value = index
    if (index >= 0 && index < customers.value.length) {
      cookingState.currentCustomer = customers.value[index]
      cookingState.hint = `已选择 ${customers.value[index].name}，开始烹饪！`
    }
  },
  
  // 更新顾客耐心（用餐中的顾客不消耗耐心）
  updateCustomerPatience() {
    const toRemove = []
    customers.value.forEach((customer, index) => {
      // 用餐中的顾客不消耗耐心
      if (customer.status === 'eating') return
      
      customer.patience -= 1
      if (customer.patience <= 0) {
        toRemove.push(index)
      }
    })
    return toRemove // 返回需要移除的顾客索引
  },
  
  // 添加金币
  addMoney(amount) {
    state.money += amount
    state.dailyEarnings += amount
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
  },
  
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
  
  // ========== 库存操作 ==========
  
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
  buyIngredient(ingredientId, count, price) {
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
  
  // ========== 厨具操作 ==========
  
  // 添加食材到厨具（支持堆叠）
  addIngredientToAppliance(applianceId, ingredientData) {
    const appliance = applianceStates[applianceId]
    if (!appliance) return false
    // 只有空闲或已有食材状态才能添加
    if (appliance.status !== 'idle' && appliance.status !== 'hasIngredients') return false
    
    // 获取食材的最大堆叠数
    const maxStack = ingredientData.maxStack || 1
    
    // 检查是否已有相同食材可以堆叠
    const existingIndex = appliance.ingredients.findIndex(ing => ing.id === ingredientData.id)
    
    if (existingIndex !== -1) {
      // 已有相同食材，检查是否可以堆叠
      const existing = appliance.ingredients[existingIndex]
      const currentCount = existing.count || 1
      
      if (currentCount >= maxStack) {
        return false // 已达到最大堆叠数
      }
      
      // 增加数量
      appliance.ingredients[existingIndex] = {
        ...existing,
        count: currentCount + 1
      }
      return true
    }
    
    // 没有相同食材，检查槽位容量
    const applianceData = appliances[applianceId]
    const capacity = applianceData?.capacity || 1
    
    if (appliance.ingredients.length >= capacity) {
      return false // 槽位已满
    }
    
    // 添加新食材（保留传入的数量）
    appliance.ingredients.push({
      ...ingredientData,
      count: ingredientData.count || 1  // 使用传入的数量，默认1
    })
    appliance.status = 'hasIngredients'
    return true
  },
  
  // 开始处理（手动触发）
  startProcessing(applianceId, processTime, matchedDish) {
    const appliance = applianceStates[applianceId]
    if (!appliance || appliance.status !== 'hasIngredients') return false
    if (appliance.ingredients.length === 0) return false
    
    // 设置厨具状态
    appliance.status = 'processing'
    appliance.outputDish = matchedDish // 可能是菜品或null（未知菜品）
    appliance.progress = 0
    appliance.startTime = Date.now()
    appliance.processTime = processTime
    
    return true
  },
  
  // 更新厨具进度
  updateApplianceProgress(applianceId) {
    const appliance = applianceStates[applianceId]
    if (!appliance) return
    
    if (appliance.status === 'processing') {
      const elapsed = Date.now() - appliance.startTime
      appliance.progress = Math.min(100, (elapsed / appliance.processTime) * 100)
      
      if (appliance.progress >= 100) {
        appliance.status = 'done'
        appliance.burnTimer = Date.now()
      }
    }
  },
  
  // 检查烧焦
  checkBurn(applianceId, burnTime) {
    const appliance = applianceStates[applianceId]
    if (!appliance || appliance.status !== 'done' || burnTime <= 0) return false
    
    const elapsed = Date.now() - appliance.burnTimer
    if (elapsed >= burnTime) {
      appliance.status = 'burned'
      return true
    }
    return false
  },
  
  // 装盘（盘子拖到厨具上）
  serveDish(applianceId) {
    const appliance = applianceStates[applianceId]
    if (!appliance || appliance.status !== 'done') return null
    
    const dish = appliance.outputDish
    
    // 重置厨具
    this.resetAppliance(applianceId)
    
    return dish
  },
  
  // 清空厨具（移除所有食材）
  clearAppliance(applianceId) {
    const appliance = applianceStates[applianceId]
    if (!appliance) return false
    // 只有有食材状态才能清空
    if (appliance.status !== 'hasIngredients') return false
    
    appliance.ingredients = []
    appliance.status = 'idle'
    return true
  },
  
  // 从厨具中移除指定食材
  removeIngredientFromAppliance(applianceId, index) {
    const appliance = applianceStates[applianceId]
    if (!appliance) return null
    if (appliance.status !== 'hasIngredients') return null
    if (index < 0 || index >= appliance.ingredients.length) return null
    
    const removed = appliance.ingredients.splice(index, 1)[0]
    
    // 如果没有食材了，重置状态
    if (appliance.ingredients.length === 0) {
      appliance.status = 'idle'
    }
    
    return removed
  },
  
  // 重置厨具状态
  resetAppliance(applianceId) {
    const appliance = applianceStates[applianceId]
    if (!appliance) return
    
    appliance.status = 'idle'
    appliance.ingredients = []
    appliance.outputDish = null
    appliance.progress = 0
    appliance.burnProgress = 0
    appliance.burnTimer = 0
    appliance.startTime = 0
    appliance.processTime = 0
  },
  
  // 清理烧焦的厨具
  cleanAppliance(applianceId, cleanTime) {
    const appliance = applianceStates[applianceId]
    if (!appliance || appliance.status !== 'burned') return false
    
    appliance.status = 'cleaning'
    appliance.progress = 0
    appliance.startTime = Date.now()
    appliance.processTime = cleanTime
    
    return true
  },
  
  // 更新清理进度
  updateCleaningProgress(applianceId) {
    const appliance = applianceStates[applianceId]
    if (!appliance || appliance.status !== 'cleaning') return
    
    const elapsed = Date.now() - appliance.startTime
    appliance.progress = Math.min(100, (elapsed / appliance.processTime) * 100)
    
    if (appliance.progress >= 100) {
      this.resetAppliance(applianceId)
    }
  },
  
  // 获取烧焦倒计时剩余比例 (0-100)
  getBurnProgress(applianceId, burnTime) {
    const appliance = applianceStates[applianceId]
    if (!appliance || appliance.status !== 'done' || burnTime <= 0) return 0
    
    const elapsed = Date.now() - appliance.burnTimer
    return Math.min(100, (elapsed / burnTime) * 100)
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
  
  // ========== 厨具布局操作 ==========
  
  // 更新厨具位置
  updateAppliancePosition(applianceId, row, col) {
    const app = userApplianceLayout.value.find(a => a.id === applianceId)
    if (app) {
      app.row = row
      app.col = col
    }
  },
  
  // 添加新厨具
  addAppliance(applianceId, row, col, width, height) {
    // 检查是否已存在
    const exists = userApplianceLayout.value.find(a => a.id === applianceId)
    if (exists) return false
    
    // 添加到布局
    userApplianceLayout.value.push({ id: applianceId, row, col, width, height })
    
    // 初始化厨具状态
    if (!applianceStates[applianceId]) {
      applianceStates[applianceId] = {
        status: 'idle',
        ingredient: null,
        output: null,
        progress: 0,
        burnProgress: 0,
        burnTimer: 0,
        startTime: 0,
        processTime: 0
      }
    }
    return true
  },
  
  // 移除厨具
  removeAppliance(applianceId) {
    const index = userApplianceLayout.value.findIndex(a => a.id === applianceId)
    if (index !== -1) {
      userApplianceLayout.value.splice(index, 1)
      delete applianceStates[applianceId]
      // 也从用户数据中移除
      const userIndex = userData.appliances.indexOf(applianceId)
      if (userIndex !== -1) {
        userData.appliances.splice(userIndex, 1)
      }
      return true
    }
    return false
  },
  
  // ========== 用户数据操作 ==========
  
  // 获取用户数据
  getUserData() {
    return userData
  },
  
  // 购买厨具
  buyAppliance(applianceId, price) {
    if (state.money < price) return false
    
    state.money -= price
    userData.appliances.push(applianceId)
    
    // 重新初始化布局
    initUserApplianceLayout()
    initApplianceStates()
    
    return true
  },
  
  // 检查是否拥有厨具
  hasAppliance(applianceId) {
    return userData.appliances.includes(applianceId)
  },
  
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
  
  // 购买调料
  buySeasoning(seasoningId, amount, price) {
    const totalCost = price
    if (state.money < totalCost) return false
    
    state.money -= totalCost
    if (userData.seasonings[seasoningId] !== undefined) {
      userData.seasonings[seasoningId] += amount
    } else {
      userData.seasonings[seasoningId] = amount
    }
    return true
  },
  
  // 获取盘子数量
  getPlatesCount() {
    return userData.plates
  },
  
  // 购买盘子
  buyPlates(count, price) {
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

// ========== 导出 ==========
export const useGameStore = () => ({
  state,
  customers,
  selectedCustomerIndex,
  cookingState,
  selectedIngredients,
  inventory,
  applianceStates,
  preparedItems,
  userApplianceLayout,
  userData,
  initApplianceStates,
  initUserApplianceLayout,
  ...getters,
  ...actions
})

export default useGameStore
