/**
 * 厨具状态模块
 * Appliance State Module
 * 
 * 管理厨具状态、处理进度、布局等
 */

import { reactive, ref } from 'vue'
import { appliances } from '../../data/appliances'
import { createApplianceState as createState } from '../../tools/stateFactories'
import { GRID } from '../../constants'

// 从常量模块获取网格配置
const { COLS: GRID_COLS, ROWS: GRID_ROWS } = GRID

/**
 * 创建厨具状态模块
 * @param {Object} userData - 用户数据引用
 */
export function createApplianceStateModule(userData) {
  // ========== 厨具状态 ==========
  const applianceStates = reactive({})
  
  // 用户的厨具布局配置
  const userApplianceLayout = ref([])

  // ========== 初始化函数 ==========
  
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
  
  // 根据用户拥有的厨具初始化布局
  function initUserApplianceLayout() {
    const layouts = []
    let currentRow = 1
    let currentCol = 1
    
    userData.appliances.forEach((appId) => {
      const applianceData = appliances[appId]
      const gridSize = applianceData?.gridSize || { cols: 2, rows: 2 }
      const width = gridSize.cols
      const height = gridSize.rows
      
      if (currentCol + width - 1 > GRID_COLS) {
        currentRow += getMaxHeightInRow(layouts, currentRow)
        currentCol = 1
      }
      
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
  
  // 初始化厨具状态
  function initApplianceStates() {
    userApplianceLayout.value.forEach(app => {
      if (!applianceStates[app.id]) {
        applianceStates[app.id] = createState()
      }
    })
  }

  // ========== Actions ==========
  const actions = {
    // 初始化
    initUserApplianceLayout,
    initApplianceStates,
    
    // 添加食材到厨具（支持堆叠）
    addIngredientToAppliance(applianceId, ingredientData) {
      const appliance = applianceStates[applianceId]
      if (!appliance) return false
      if (appliance.status !== 'idle' && appliance.status !== 'hasIngredients') return false
      
      const maxStack = ingredientData.maxStack || 1
      const existingIndex = appliance.ingredients.findIndex(ing => ing.id === ingredientData.id)
      
      if (existingIndex !== -1) {
        const existing = appliance.ingredients[existingIndex]
        const currentCount = existing.count || 1
        
        if (currentCount >= maxStack) return false
        
        appliance.ingredients[existingIndex] = {
          ...existing,
          count: currentCount + 1
        }
        return true
      }
      
      const applianceData = appliances[applianceId]
      const capacity = applianceData?.capacity || 1
      
      if (appliance.ingredients.length >= capacity) return false
      
      appliance.ingredients.push({
        ...ingredientData,
        count: ingredientData.count || 1
      })
      appliance.status = 'hasIngredients'
      return true
    },
    
    // 开始处理
    startProcessing(applianceId, processTime, matchedDish) {
      const appliance = applianceStates[applianceId]
      if (!appliance || appliance.status !== 'hasIngredients') return false
      if (appliance.ingredients.length === 0) return false
      
      appliance.status = 'processing'
      appliance.outputDish = matchedDish
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
    
    // 装盘
    serveDish(applianceId) {
      const appliance = applianceStates[applianceId]
      if (!appliance || appliance.status !== 'done') return null
      
      const dish = appliance.outputDish
      actions.resetAppliance(applianceId)
      
      return dish
    },
    
    // 清空厨具
    clearAppliance(applianceId) {
      const appliance = applianceStates[applianceId]
      if (!appliance) return false
      if (appliance.status !== 'hasIngredients') return false
      
      appliance.ingredients = []
      appliance.status = 'idle'
      return true
    },
    
    // 添加垃圾到垃圾桶
    addTrashToTrashBin(applianceId, itemData) {
      const appliance = applianceStates[applianceId]
      const applianceData = appliances[applianceId]
      if (!appliance || applianceData?.type !== 'trash') return false
      
      if (appliance.status !== 'idle' && appliance.status !== 'hasIngredients') return false
      
      const currentCount = appliance.trashCount || 0
      const capacity = applianceData.capacity || 20
      
      if (currentCount >= capacity) return false
      
      appliance.trashCount = currentCount + 1
      appliance.status = 'hasIngredients'
      
      return true
    },
    
    // 开始清理垃圾桶
    startEmptyingTrash(applianceId) {
      const appliance = applianceStates[applianceId]
      const applianceData = appliances[applianceId]
      if (!appliance || applianceData?.type !== 'trash') return false
      if (appliance.status !== 'hasIngredients') return false
      if (!appliance.trashCount || appliance.trashCount <= 0) return false
      
      appliance.status = 'cleaning'
      appliance.progress = 0
      appliance.startTime = Date.now()
      appliance.processTime = applianceData.cleanTime || 3000
      
      return true
    },
    
    // 更新垃圾桶清理进度
    updateTrashCleaningProgress(applianceId) {
      const appliance = applianceStates[applianceId]
      const applianceData = appliances[applianceId]
      if (!appliance || applianceData?.type !== 'trash') return
      if (appliance.status !== 'cleaning') return
      
      const elapsed = Date.now() - appliance.startTime
      appliance.progress = Math.min(100, (elapsed / appliance.processTime) * 100)
      
      if (appliance.progress >= 100) {
        appliance.status = 'idle'
        appliance.trashCount = 0
        appliance.progress = 0
        appliance.startTime = 0
        appliance.processTime = 0
      }
    },
    
    // 获取垃圾桶容量百分比
    getTrashFillPercent(applianceId) {
      const appliance = applianceStates[applianceId]
      const applianceData = appliances[applianceId]
      if (!appliance || applianceData?.type !== 'trash') return 0
      
      const capacity = applianceData.capacity || 20
      const count = appliance.trashCount || 0
      return Math.min(100, (count / capacity) * 100)
    },
    
    // 从厨具中移除指定食材
    removeIngredientFromAppliance(applianceId, index) {
      const appliance = applianceStates[applianceId]
      if (!appliance) return null
      if (appliance.status !== 'hasIngredients') return null
      if (index < 0 || index >= appliance.ingredients.length) return null
      
      const removed = appliance.ingredients.splice(index, 1)[0]
      
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
        actions.resetAppliance(applianceId)
      }
    },
    
    // 获取烧焦倒计时剩余比例
    getBurnProgress(applianceId, burnTime) {
      const appliance = applianceStates[applianceId]
      if (!appliance || appliance.status !== 'done' || burnTime <= 0) return 0
      
      const elapsed = Date.now() - appliance.burnTimer
      return Math.min(100, (elapsed / burnTime) * 100)
    },
    
    // 使厨具损坏
    breakAppliance(applianceId) {
      const appliance = applianceStates[applianceId]
      if (!appliance) return false
      
      const canBreakStatuses = ['idle', 'hasIngredients', 'processing', 'done']
      if (!canBreakStatuses.includes(appliance.status)) return false
      
      appliance.status = 'broken'
      appliance.ingredients = []
      appliance.outputDish = null
      appliance.progress = 0
      appliance.burnProgress = 0
      appliance.burnTimer = 0
      appliance.startTime = 0
      appliance.processTime = 0
      
      return true
    },
    
    // 开始修理厨具
    startRepairingAppliance(applianceId, repairTime, repairCost, state) {
      const appliance = applianceStates[applianceId]
      if (!appliance || appliance.status !== 'broken') return false
      
      if (repairCost > 0 && state.money < repairCost) return false
      
      if (repairCost > 0) {
        state.money -= repairCost
      }
      
      appliance.status = 'repairing'
      appliance.progress = 0
      appliance.startTime = Date.now()
      appliance.processTime = repairTime
      
      return true
    },
    
    // 更新修理进度
    updateRepairingProgress(applianceId) {
      const appliance = applianceStates[applianceId]
      if (!appliance || appliance.status !== 'repairing') return
      
      const elapsed = Date.now() - appliance.startTime
      appliance.progress = Math.min(100, (elapsed / appliance.processTime) * 100)
      
      if (appliance.progress >= 100) {
        actions.resetAppliance(applianceId)
      }
    },
    
    // 检查厨具是否损坏
    isApplianceBroken(applianceId) {
      const appliance = applianceStates[applianceId]
      return appliance && appliance.status === 'broken'
    },
    
    // 检查厨具是否正在修理
    isApplianceRepairing(applianceId) {
      const appliance = applianceStates[applianceId]
      return appliance && appliance.status === 'repairing'
    },
    
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
      const exists = userApplianceLayout.value.find(a => a.id === applianceId)
      if (exists) return false
      
      userApplianceLayout.value.push({ id: applianceId, row, col, width, height })
      
      if (!applianceStates[applianceId]) {
        applianceStates[applianceId] = createState()
      }
      return true
    },
    
    // 移除厨具
    removeAppliance(applianceId) {
      const index = userApplianceLayout.value.findIndex(a => a.id === applianceId)
      if (index !== -1) {
        userApplianceLayout.value.splice(index, 1)
        delete applianceStates[applianceId]
        const userIndex = userData.appliances.indexOf(applianceId)
        if (userIndex !== -1) {
          userData.appliances.splice(userIndex, 1)
        }
        return true
      }
      return false
    }
  }

  return {
    applianceStates,
    userApplianceLayout,
    ...actions
  }
}
