
/**
 * 游戏组合式函数
 * useGame Composable
 * 
 * 整合所有游戏系统，提供统一的游戏控制接口
 */

import { ref, onUnmounted, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { TimeSystem } from '../systems/TimeSystem'
import { CustomerSystem } from '../systems/CustomerSystem'
import { soundManager } from '../systems/SoundSystem'
import { gameConfig } from '../data/config'
import { getIngredientList, rawIngredients, preparedIngredients, getPreparedBySource } from '../data/ingredients'
import { dishes, getDishList } from '../data/dishes'
import { appliances } from '../data/appliances'
import { useRandomEvents } from '../events'

export function useGame() {
  // 初始化 Store
  const store = useGameStore()
  
  // 初始化系统
  const timeSystem = new TimeSystem(store)
  const customerSystem = new CustomerSystem(store, timeSystem)
  
  // 定时器引用
  let gameLoopTimer = null
  let spawnTimer = null
  
  // 打烊状态：正在等待厨具完成
  let isClosing = false
  
  // 调试状态
  const debugState = ref({
    customerSpawnEnabled: true
  })
  
  // Toast 消息队列
  const toasts = ref([])
  
  // 厨具更新定时器
  let applianceTimer = null
  
  // ========== 显示提示函数（提前定义，供随机事件系统使用） ==========
  
  /**
   * 显示提示消息
   */
  function showToast(message, type = 'info') {
    const id = Date.now()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 2500)
  }
  
  // ========== 随机事件系统 ==========
  
  const randomEventsSystem = useRandomEvents({
    showToast,
    getCurrentDay: () => store.state.day,
    applianceStates: store.applianceStates
  })
  
  // 被虫子吃的食材ID（用于动画）
  const bugEatenIngredientId = ref(null)
  
  /**
   * 检查食材被虫子吃事件
   * 随机选择一个有库存的食材进行检查
   */
  function checkIngredientBugEvent() {
    // 获取所有有库存的食材
    const ingredientsWithStock = Object.entries(store.inventory)
      .filter(([id, count]) => count > 0 && rawIngredients[id])
      .map(([id, count]) => ({ id, count, ...rawIngredients[id] }))
    
    if (ingredientsWithStock.length === 0) return
    
    // 随机选择一个食材
    const randomIndex = Math.floor(Math.random() * ingredientsWithStock.length)
    const ingredient = ingredientsWithStock[randomIndex]
    
    // 检查是否触发虫子事件
    if (randomEventsSystem.checkIngredientBug(ingredient)) {
      // 减少库存
      store.inventory[ingredient.id]--
      
      // 设置被吃的食材ID（触发动画）
      bugEatenIngredientId.value = ingredient.id
      // 0.8秒后清除（动画时长）
      setTimeout(() => {
        bugEatenIngredientId.value = null
      }, 800)
    }
  }
  
  // ========== 游戏控制 ==========
  
  /**
   * 开始游戏
   */
  async function startGame() {
    store.startGame()
    // 初始化音效系统
    await soundManager.init()
    soundManager.resume()
    soundManager.playClick()
  }
  
  /**
   * 开店
   */
  function openShop() {
    store.openShop()
    timeSystem.reset()
    
    // 恢复音频上下文（浏览器自动播放策略）
    soundManager.resume()
    soundManager.playOpenShop()
    // 延迟启动BGM，确保音频上下文已恢复
    setTimeout(() => {
      soundManager.resume()
      soundManager.startBGM()
    }, 100)
    
    showToast('🏮 开店了！欢迎光临！', 'success')
    
    // 初始生成1个顾客
    setTimeout(() => customerSystem.spawnCustomer(), 500)
    
    // 启动游戏循环
    startGameLoop()
    
    // 启动厨具更新循环
    startApplianceLoop()
  }
  
  /**
   * 打烊
   */
  function closeShop() {
    // 停止顾客生成循环（不再生成新顾客，不再更新时间）
    if (spawnTimer) {
      clearInterval(spawnTimer)
      spawnTimer = null
    }
    
    // 进入打烊状态
    isClosing = true
    soundManager.stopBGM()
    soundManager.startClosingBGM()  // 播放打烊GBM
    showToast('🌙 打烊中，完成剩余订单...', 'success')
    
    // 检查是否可以立即关店
    checkCanFinishClose()
  }
  
  /**
   * 检查是否可以完成打烊
   * 条件：无顾客 + 无正在处理的厨具 + 无正在清洗的盘子
   */
  function checkCanFinishClose() {
    if (!isClosing) return
    
    // 检查顾客
    const hasCustomers = store.customers.value.length > 0
    
    // 检查厨具
    const hasProcessingAppliance = Object.values(store.applianceStates).some(
      app => app.status === 'processing' || app.status === 'cleaning'
    )
    
    // 如果都完成了，正式关店
    // 注：盘子清洗在 App.vue 中管理，这里只检查顾客和厨具
    if (!hasCustomers && !hasProcessingAppliance) {
      finishCloseShop()
    }
  }
  
  /**
   * 完成打烊（所有条件满足后调用）
   */
  function finishCloseShop() {
    isClosing = false
    
    // 停止所有循环
    stopGameLoop()
    
    store.closeShop()
    
    soundManager.stopClosingBGM()  // 停止打烊GBM
    soundManager.stopAllLoops()
    soundManager.playCloseShop()
    showToast(`✨ 今日营业结束！第 ${store.state.day} 天即将开始`, 'success')
  }
  
  /**
   * 启动游戏循环
   */
  function startGameLoop() {
    // 游戏主循环（100ms）- 更新耐心和用餐进度
    gameLoopTimer = setInterval(() => {
      // 未开店且未打烊时不运行
      if (!store.state.isOpen && !isClosing) return
      
      // 更新用餐进度
      updateEatingProgress()
      
      // 更新顾客耐心（开店和打烊期间都继续）
      const leftCustomers = customerSystem.updatePatience()
      leftCustomers.forEach(customer => {
        soundManager.playCustomerAngry()
        showToast(`${customer.icon} 不耐烦地离开了！`, 'error')
      })
      
      // 打烊期间，检查是否可以完成关店
      if (isClosing) {
        checkCanFinishClose()
      }
    }, gameConfig.gameLoopInterval)
    
    // 顾客生成循环（1000ms）
    spawnTimer = setInterval(() => {
      if (!store.state.isOpen) return
      
      // 更新时间
      const stillOpen = timeSystem.tick()
      if (!stillOpen) {
        closeShop()
        return
      }
      
      // 尝试生成顾客（可被调试开关控制）
      if (debugState.value.customerSpawnEnabled) {
        const newCustomer = customerSystem.trySpawnCustomer()
        if (newCustomer) {
          soundManager.playCustomerArrive()
          showToast(`${newCustomer.icon} ${newCustomer.name}来了，想要${newCustomer.dish}`, 'success')
        }
      }
      
      // 检查食材被虫子吃事件
      checkIngredientBugEvent()
    }, gameConfig.customerSpawnInterval)
  }
  
  /**
   * 停止游戏循环
   */
  function stopGameLoop() {
    if (gameLoopTimer) {
      clearInterval(gameLoopTimer)
      gameLoopTimer = null
    }
    if (spawnTimer) {
      clearInterval(spawnTimer)
      spawnTimer = null
    }
    if (applianceTimer) {
      clearInterval(applianceTimer)
      applianceTimer = null
    }
  }
  
  // ========== 厨具操作 ==========
  
  /**
   * 启动厨具更新循环
   */
  function startApplianceLoop() {
    applianceTimer = setInterval(() => {
      // 更新所有厨具状态
      Object.keys(store.applianceStates).forEach(applianceId => {
        const appliance = store.applianceStates[applianceId]
        const applianceData = appliances[applianceId]
        
        if (appliance.status === 'processing') {
          // 先检查专属事件
          if (randomEventsSystem.checkSpecialEvent(applianceId)) {
            return
          }
          
          // 再检查通用损坏事件
          if (randomEventsSystem.checkApplianceBreak(applianceId)) {
            return
          }
          
          store.updateApplianceProgress(applianceId)
          
          // 检查是否完成
          if (appliance.status === 'done') {
            soundManager.playSizzle()
            showToast(`✨ ${applianceData?.name || applianceId}处理完成！`, 'success')
            
            // 打烊期间检查是否可以完成关店
            if (isClosing) {
              checkCanFinishClose()
            }
          }
        } else if (appliance.status === 'done' && applianceData?.burnTime > 0) {
          // 更新烧焦进度（开店和打烊期间都会烧焦）
          const elapsed = Date.now() - appliance.burnTimer
          appliance.burnProgress = Math.min(100, (elapsed / applianceData.burnTime) * 100)
          
          // 检查烧焦
          if (store.checkBurn(applianceId, applianceData.burnTime)) {
            soundManager.playFail()
            showToast(`🔥 ${applianceData.name}上的食材烧焦了！`, 'error')
          }
        } else if (appliance.status === 'cleaning') {
          // 垃圾桶清理进度特殊处理
          if (applianceData?.type === 'trash') {
            store.updateTrashCleaningProgress(applianceId)
            
            // 清理完成后检查是否可以关店
            if (appliance.status === 'idle') {
              showToast(`✅ 垃圾桶清理完成！`, 'success')
              if (isClosing) {
                checkCanFinishClose()
              }
            }
          } else {
            store.updateCleaningProgress(applianceId)
            
            // 清理完成后检查是否可以关店
            if (appliance.status === 'idle' && isClosing) {
              checkCanFinishClose()
            }
          }
        } else if (appliance.status === 'repairing') {
          // 厨具修理进度
          store.updateRepairingProgress(applianceId)
          
          // 修理完成
          if (appliance.status === 'idle') {
            soundManager.playSuccess()
            showToast(`✅ ${applianceData?.name || applianceId}修好了！`, 'success')
            if (isClosing) {
              checkCanFinishClose()
            }
          }
        }
      })
    }, 100)
  }
  
  /**
   * 检查食材是否可以放到指定厨具
   * 基于是否有实际产出来判断，而不是仅依赖 canProcess 配置
   */
  function canProcessIngredient(ingredientId, applianceId) {
    const ingredient = rawIngredients[ingredientId]
    if (!ingredient) return false
    
    // 直接检查是否有对应的产出
    const output = getOutputForIngredient(ingredientId, applianceId)
    return output !== null
  }
  
  /**
   * 获取食材在指定厨具上的产出
   */
  function getOutputForIngredient(ingredientId, applianceId) {
    // 查找匹配的备菜
    const preparedList = getPreparedBySource(ingredientId)
    const match = preparedList.find(p => p.appliance === applianceId)
    return match || null
  }
  
  /**
   * 将食材放到厨具上
   */
  function dropIngredientOnAppliance(ingredientId, applianceId) {
    // 检查厨具是否空闲
    const appliance = store.applianceStates[applianceId]
    if (!appliance || appliance.status !== 'idle') {
      showToast('这个厨具正在使用中！', 'error')
      return false
    }
    
    // 检查食材是否可以放到这个厨具
    if (!canProcessIngredient(ingredientId, applianceId)) {
      const ingredient = rawIngredients[ingredientId]
      const applianceData = appliances[applianceId]
      showToast(`${ingredient?.name || ingredientId} 不能放到${applianceData?.name || applianceId}上！`, 'error')
      return false
    }
    
    // 检查库存
    if ((store.inventory[ingredientId] || 0) <= 0) {
      showToast('食材不足！', 'error')
      return false
    }
    
    // 获取产出
    const output = getOutputForIngredient(ingredientId, applianceId)
    if (!output) {
      showToast('无法处理这个食材！', 'error')
      return false
    }
    
    // 获取厨具数据
    const applianceData = appliances[applianceId]
    const processTime = output.processTime || applianceData?.processTime || 3000
    
    // 开始处理
    const result = store.startProcessing(applianceId, ingredientId, output.id, processTime)
    if (result) {
      soundManager.playClick()
      const ingredient = rawIngredients[ingredientId]
      showToast(`${ingredient?.icon || ''} 开始处理 ${ingredient?.name || ingredientId}`, 'success')
      return true
    }
    
    return false
  }
  
  /**
   * 点击厨具（收取/清理）
   */
  function clickAppliance(applianceId) {
    const appliance = store.applianceStates[applianceId]
    const applianceData = appliances[applianceId]
    
    if (appliance.status === 'done') {
      // 收取备菜
      const output = store.collectPrepared(applianceId)
      if (output) {
        const prepared = preparedIngredients[output]
        soundManager.playSuccess()
        showToast(`✅ 收取了 ${prepared?.icon || ''} ${prepared?.name || output}`, 'success')
      }
    } else if (appliance.status === 'burned') {
      // 开始清理
      const cleanTime = applianceData?.cleanTime || 2000
      if (store.cleanAppliance(applianceId, cleanTime)) {
        soundManager.playClick()
        showToast(`🧹 正在清理${applianceData?.name || applianceId}...`, 'success')
      }
    }
  }
  
  /**
   * 获取烧焦倒计时进度
   */
  function getBurnProgress(applianceId) {
    const applianceData = appliances[applianceId]
    if (!applianceData || applianceData.burnTime <= 0) return 0
    return store.getBurnProgress(applianceId, applianceData.burnTime)
  }
  
  // ========== 顾客操作 ==========
  
  /**
   * 选择顾客
   */
  function selectCustomer(index) {
    soundManager.playSelect()
    customerSystem.selectCustomer(index)
  }
  
  /**
   * 上菜给顾客（开始用餐）
   * @param {number} customerIndex 顾客索引
   * @param {string} dishId 菜品ID
   * @returns {boolean} 是否成功
   */
  function serveCustomer(customerIndex, dishId) {
    const customer = store.customers.value[customerIndex]
    if (!customer) {
      showToast('❌ 顾客不存在', 'error')
      return false
    }
    
    // 检查菜品是否匹配
    if (customer.dishId !== dishId) {
      showToast(`❌ 这不是 ${customer.name} 想要的菜！`, 'error')
      return false
    }
    
    // 开始用餐
    customer.status = 'eating'
    customer.eatingProgress = 0
    customer.eatingTime = 3000 // 3秒用餐时间
    customer.eatingStartTime = Date.now()
    
    soundManager.playSuccess()
    showToast(`✅ ${customer.icon} 开始用餐`, 'success')
    
    return true
  }
  
  /**
   * 更新顾客用餐进度
   */
  function updateEatingProgress() {
    const toComplete = []
    
    store.customers.value.forEach((customer, index) => {
      if (customer.status === 'eating') {
        const elapsed = Date.now() - customer.eatingStartTime
        const newProgress = Math.min(100, (elapsed / customer.eatingTime) * 100)
        customer.eatingProgress = newProgress
        
        // 用餐完成
        if (newProgress >= 100) {
          toComplete.push(index)
        }
      }
    })
    
    // 从后往前处理完成的顾客
    for (let i = toComplete.length - 1; i >= 0; i--) {
      completeCustomerMeal(toComplete[i])
    }
  }
  
  /**
   * 完成顾客用餐
   */
  function completeCustomerMeal(customerIndex) {
    const customer = store.customers.value[customerIndex]
    if (!customer) return
    
    // 计算收入
    const result = customerSystem.serveCustomer(customerIndex)
    if (result) {
      soundManager.playCustomerHappy()
      showToast(`💰 ${customer.icon} 满意地离开，获得 ${result.reward} 金币`, 'money')
      
      // 检查连击
      if (result.combo >= 2) {
        showToast(`🔥 ${result.combo} 连击！`, 'success')
      }
    }
  }
  
  // ========== 食材操作 ==========
  
  /**
   * 获取食材列表
   */
  const ingredientList = computed(() => getIngredientList())
  
  /**
   * 切换食材选择
   */
  function toggleIngredient(ingredient) {
    store.toggleIngredient(ingredient)
  }
  
  /**
   * 检查食材是否选中
   */
  function isIngredientSelected(ingredient) {
    return store.selectedIngredients.value.some(i => i.id === ingredient.id)
  }
  
  // ========== UI 辅助 ==========
  
  // showToast 已在文件开头定义，供随机事件系统使用
  
  /**
   * 获取格式化时间
   */
  const formattedTime = computed(() => timeSystem.getFormattedTime())
  
  /**
   * 获取时间段名称
   */
  const timePeriodName = computed(() => timeSystem.getPeriodName())
  
  /**
   * 获取目标进度
   */
  const goalProgress = computed(() => store.goalProgress.value)
  
  // ========== 调试功能 ==========
  
  /**
   * 切换顾客生成开关
   */
  function toggleCustomerSpawn() {
    debugState.value.customerSpawnEnabled = !debugState.value.customerSpawnEnabled
    return debugState.value.customerSpawnEnabled
  }
  
  /**
   * 手动生成顾客
   */
  function debugSpawnCustomer() {
    if (!store.state.isOpen) {
      showToast('请先开店！', 'error')
      return null
    }
    const customer = customerSystem.spawnCustomer()
    if (customer) {
      soundManager.playCustomerArrive()
      showToast(`[调试] ${customer.icon} ${customer.name}来了`, 'success')
    }
    return customer
  }
  
  /**
   * 生成指定菜品的顾客
   */
  function debugSpawnDish(dishId) {
    if (!store.state.isOpen) {
      showToast('请先开店！', 'error')
      return null
    }
    const customer = customerSystem.spawnCustomerWithDish(dishId)
    if (customer) {
      soundManager.playCustomerArrive()
      showToast(`[调试] 生成订单: ${customer.dishIcon} ${customer.dish}`, 'success')
    }
    return customer
  }
  
  /**
   * 获取所有菜品列表
   */
  const dishList = computed(() => getDishList())
  
  // ========== 生命周期 ==========
  
  onUnmounted(() => {
    stopGameLoop()
    soundManager.stopAll()
  })
  
  // ========== 返回接口 ==========
  
  return {
    // 状态
    state: store.state,
    customers: store.customers,
    selectedCustomerIndex: store.selectedCustomerIndex,
    cookingState: store.cookingState,
    selectedIngredients: store.selectedIngredients,
    inventory: store.inventory,
    applianceStates: store.applianceStates,
    preparedItems: store.preparedItems,
    toasts,
    
    // 计算属性
    formattedTime,
    timePeriodName,
    goalProgress,
    ingredientList,
    
    // 游戏控制
    startGame,
    openShop,
    closeShop,
    
    // 顾客操作
    selectCustomer,
    serveCustomer,
    
    // 食材操作
    toggleIngredient,
    isIngredientSelected,
    
    // 厨具操作
    canProcessIngredient,
    dropIngredientOnAppliance,
    clickAppliance,
    getBurnProgress,
    
    // 厨具布局
    userApplianceLayout: store.userApplianceLayout,
    updateAppliancePosition: store.updateAppliancePosition,
    addAppliance: store.addAppliance,
    removeAppliance: store.removeAppliance,
    
    // 库存操作
    getInventory: store.getInventory,
    buyIngredient: store.buyIngredient,
    hasEnoughIngredients: store.hasEnoughIngredients,
    
    // 用户数据
    userData: store.userData,
    getUserData: store.getUserData,
    buyAppliance: store.buyAppliance,
    hasAppliance: store.hasAppliance,
    getSeasoningAmount: store.getSeasoningAmount,
    consumeSeasoning: store.consumeSeasoning,
    buySeasoning: store.buySeasoning,
    getPlatesCount: store.getPlatesCount,
    buyPlates: store.buyPlates,
    usePlate: store.usePlate,
    returnPlate: store.returnPlate,
    
    // UI 辅助
    showToast,
    
    // 音效系统
    soundManager,
    
    // 调试功能
    debugState,
    toggleCustomerSpawn,
    debugSpawnCustomer,
    debugSpawnDish,
    dishList,
    
    // 随机事件系统
    randomEventsSystem,
    bugEatenIngredientId
  }
}

export default useGame
