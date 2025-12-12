/**
 * 自动做菜系统
 * useAutoCook Composable
 * 
 * 基于预定义的执行步骤进行烹饪：
 * 1. 读取菜品的执行步骤
 * 2. 按顺序执行每个步骤
 * 3. 完成后装盘上菜
 * 4. 清洗盘子
 */

import { ref, reactive } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { dishes } from '../data/dishes'
import { preparedIngredients, rawIngredients, seasonings } from '../data/ingredients'
import { appliances } from '../data/appliances'
import { getRecipeSteps } from '../data/recipeSteps'
import { APPLIANCE_STATUS, PLATE_STATUS, CUSTOMER_STATUS } from '../constants'

/**
 * 创建自动做菜系统
 * @param {Object} options 配置选项
 */
export function useAutoCook(options) {
  const {
    customers,
    inventory,
    userData,
    applianceStates,
    preparedItems,
    plates,
    showToast,
    serveCustomer,
    handlePlateWash,
    addDishToPlate,
    handleStartCooking
  } = options

  const store = useGameStore()

  // ========== 状态 ==========
  const enabled = ref(true) // 默认开启
  let loopTimer = null

  // 初始化时启动定时器
  loopTimer = setInterval(tick, 500)

  // 任务队列 - 每个顾客的任务
  // { customerId: { dishId, steps: [...], currentStep: 0, status: 'pending'|'working'|'done' } }
  const taskQueue = reactive({})
  
  // 厨具任务映射 - 记录每个厨具正在为哪个顾客做菜
  const applianceTaskMap = reactive({}) // { applianceId: customerId }

  // 当前任务状态（用于调试显示）
  const currentTask = reactive({
    dishId: null,
    customerIndex: -1,
    stage: 'idle'
  })

  // ========== 辅助函数 ==========

  /**
   * 获取调料库存数量
   */
  function getSeasoningAmount(seasoningId) {
    const data = userData.seasonings?.[seasoningId]
    if (typeof data === 'number') return data
    if (typeof data === 'object' && data !== null) return data.currentAmount || 0
    return 0
  }

  /**
   * 找到空闲的指定类型厨具
   */
  function findIdleAppliance(applianceId) {
    const state = applianceStates[applianceId]
    if (state && state.status === APPLIANCE_STATUS.IDLE) {
      return applianceId
    }
    return null
  }

  /**
   * 检查备菜区是否有指定备菜
   */
  function hasPreparedItem(preparedId) {
    return preparedItems.value.some(p => p.id === preparedId)
  }

  /**
   * 从备菜区取出备菜
   */
  function takePreparedItem(preparedId) {
    const index = preparedItems.value.findIndex(p => p.id === preparedId)
    if (index >= 0) {
      return preparedItems.value.splice(index, 1)[0]
    }
    return null
  }

  /**
   * 将备菜放入备菜区
   */
  function addToPreparedItems(item) {
    preparedItems.value.push({
      id: item.id,
      name: item.name,
      icon: item.icon,
      image: item.image
    })
  }

  /**
   * 清理无效的任务（顾客已离开）
   */
  function cleanupInvalidTasks() {
    // 使用字符串ID集合，因为对象key是字符串
    const customerIds = new Set(customers.value.map(c => String(c.id)))
    
    // 清理任务队列
    for (const customerId of Object.keys(taskQueue)) {
      if (!customerIds.has(customerId)) {
        delete taskQueue[customerId]
      }
    }
    
    // 清理厨具任务映射
    for (const appId of Object.keys(applianceTaskMap)) {
      if (!customerIds.has(String(applianceTaskMap[appId]))) {
        delete applianceTaskMap[appId]
      }
    }
  }

  /**
   * 检查步骤所需的材料是否足够
   */
  function canExecuteStep(step) {
    if (step.type === 'prepare') {
      // 制作备菜步骤
      const input = step.input
      if (input.type === 'ingredient') {
        return (inventory[input.id] || 0) > 0
      } else if (input.type === 'prepared') {
        return hasPreparedItem(input.id)
      }
    } else if (step.type === 'cook') {
      // 最终烹饪步骤
      for (const input of step.inputs) {
        if (input.type === 'prepared') {
          if (!hasPreparedItem(input.id)) return false
        } else if (input.type === 'seasoning') {
          if (getSeasoningAmount(input.id) < (input.count || 1)) return false
        } else if (input.type === 'ingredient') {
          if ((inventory[input.id] || 0) <= 0) return false
        }
      }
    }
    return true
  }

  /**
   * 执行一个步骤
   */
  function executeStep(step) {
    const applianceId = step.appliance
    const appliance = findIdleAppliance(applianceId)
    if (!appliance) return false

    if (step.type === 'prepare') {
      // 制作备菜
      const input = step.input
      let ingredientData = null
      
      if (input.type === 'ingredient') {
        // 从库存取原材料
        if ((inventory[input.id] || 0) <= 0) return false
        ingredientData = rawIngredients[input.id]
        if (!ingredientData) return false
        
        store.addIngredientToAppliance(applianceId, {
          id: input.id,
          type: 'ingredient',
          name: ingredientData.name,
          icon: ingredientData.icon,
          image: ingredientData.image,
          maxStack: ingredientData.maxStack || 1
        })
        inventory[input.id]--
        
      } else if (input.type === 'prepared') {
        // 从备菜区取备菜
        const item = takePreparedItem(input.id)
        if (!item) return false
        ingredientData = preparedIngredients[input.id]
        if (!ingredientData) return false
        
        store.addIngredientToAppliance(applianceId, {
          id: input.id,
          type: 'prepared',
          name: ingredientData.name,
          icon: ingredientData.icon,
          image: ingredientData.image,
          maxStack: ingredientData.maxStack || 1
        })
      }
      
      handleStartCooking(applianceId)
      return true
      
    } else if (step.type === 'cook') {
      // 最终烹饪
      for (const input of step.inputs) {
        if (input.type === 'prepared') {
          const item = takePreparedItem(input.id)
          if (!item) return false
          const prepData = preparedIngredients[input.id]
          if (!prepData) return false
          
          store.addIngredientToAppliance(applianceId, {
            id: input.id,
            type: 'prepared',
            name: prepData.name,
            icon: prepData.icon,
            image: prepData.image,
            maxStack: prepData.maxStack || 1
          })
          
        } else if (input.type === 'seasoning') {
          const count = input.count || 1
          const seasoningData = seasonings[input.id]
          if (!seasoningData) return false
          if (getSeasoningAmount(input.id) < count) return false
          
          store.addIngredientToAppliance(applianceId, {
            id: input.id,
            type: 'seasoning',
            name: seasoningData.name,
            icon: seasoningData.icon,
            image: seasoningData.image,
            count: count,
            maxStack: 3
          })
          store.consumeSeasoning(input.id, count)
          
        } else if (input.type === 'ingredient') {
          if ((inventory[input.id] || 0) <= 0) return false
          const rawData = rawIngredients[input.id]
          if (!rawData) return false
          
          store.addIngredientToAppliance(applianceId, {
            id: input.id,
            type: 'ingredient',
            name: rawData.name,
            icon: rawData.icon,
            image: rawData.image,
            maxStack: rawData.maxStack || 1
          })
          inventory[input.id]--
        }
      }
      
      handleStartCooking(applianceId)
      return true
    }
    
    return false
  }

  // ========== 主循环 ==========

  /**
   * 自动做菜主循环
   */
  function tick() {
    if (!enabled.value) return

    // 清理无效任务
    cleanupInvalidTasks()

    // 1. 先处理脏盘子
    const dirtyIndex = plates.value.findIndex(p => p.status === PLATE_STATUS.DIRTY)
    if (dirtyIndex >= 0) {
      handlePlateWash(dirtyIndex)
      return
    }

    // 2. 检查已完成的厨具，取出成品
    for (const [applianceId, state] of Object.entries(applianceStates)) {
      if (state.status !== APPLIANCE_STATUS.DONE || !state.outputDish) continue
      
      const output = state.outputDish
      const taskCustomerId = applianceTaskMap[applianceId] // 获取这个厨具对应的顾客ID
      
      // 清理厨具任务映射
      if (applianceTaskMap[applianceId]) {
        delete applianceTaskMap[applianceId]
      }
      
      // 是备菜？放入备菜区
      if (preparedIngredients[output.id]) {
        const count = output.count || 1
        for (let i = 0; i < count; i++) {
          addToPreparedItems(output)
        }
        store.resetAppliance(applianceId)
        return
      }
      
      // 是成品菜？装盘上菜
      const emptyPlateIndex = plates.value.findIndex(p => p.status === PLATE_STATUS.EMPTY)
      if (emptyPlateIndex >= 0) {
        addDishToPlate(emptyPlateIndex, output)
        store.resetAppliance(applianceId)
        
        // 优先找任务对应的顾客
        let customerIndex = -1
        if (taskCustomerId) {
          customerIndex = customers.value.findIndex(c => String(c.id) === String(taskCustomerId))
        }
        // 如果找不到，找任意需要这道菜的顾客
        if (customerIndex < 0) {
          customerIndex = customers.value.findIndex(c => c.dishId === output.id)
        }
        
        if (customerIndex >= 0) {
          const customer = customers.value[customerIndex]
          const result = serveCustomer(customerIndex, output.id)
          if (result) {
            plates.value[emptyPlateIndex] = { status: PLATE_STATUS.DIRTY, dish: null }
            // 删除任务
            if (taskQueue[customer.id]) {
              delete taskQueue[customer.id]
            }
          }
        }
        return
      }
    }

    // 3. 没有顾客就跳过
    if (customers.value.length === 0) return

    // 4. 为每个顾客创建/执行任务
    for (const customer of customers.value) {
      // 跳过正在用餐的顾客
      if (customer.status === CUSTOMER_STATUS.EATING) {
        if (taskQueue[customer.id]) {
          delete taskQueue[customer.id]
        }
        continue
      }
      
      // 跳过已完成的任务
      if (taskQueue[customer.id]?.status === 'done') continue
      
      // 创建新任务
      if (!taskQueue[customer.id]) {
        const steps = getRecipeSteps(customer.dishId)
        if (!steps) continue
        
        taskQueue[customer.id] = {
          dishId: customer.dishId,
          steps: [...steps],
          currentStep: 0,
          status: 'pending'
        }
      }
      
      const task = taskQueue[customer.id]
      if (task.currentStep >= task.steps.length) {
        task.status = 'done'
        continue
      }
      
      // 获取当前步骤
      const step = task.steps[task.currentStep]
      
      // 检查厨具是否空闲
      const idleAppliance = findIdleAppliance(step.appliance)
      if (!idleAppliance) continue
      
      // 检查材料是否充足
      if (!canExecuteStep(step)) continue
      
      // 执行步骤
      const success = executeStep(step)
      if (success) {
        // 记录厨具任务映射
        applianceTaskMap[step.appliance] = customer.id
        task.currentStep++
        task.status = 'working'
        return // 每次只执行一个步骤
      }
    }
  }

  // ========== 控制函数 ==========

  /**
   * 切换自动做菜开关
   */
  function toggle() {
    enabled.value = !enabled.value

    if (enabled.value) {
      // 开启循环
      loopTimer = setInterval(tick, 500)
      showToast('[调试] 自动做菜: 开启', 'success')
      tick() // 立即执行一次
    } else {
      // 关闭循环
      if (loopTimer) {
        clearInterval(loopTimer)
        loopTimer = null
      }
      // 清空任务队列和厨具映射
      for (const key of Object.keys(taskQueue)) {
        delete taskQueue[key]
      }
      for (const key of Object.keys(applianceTaskMap)) {
        delete applianceTaskMap[key]
      }
      showToast('[调试] 自动做菜: 关闭', 'warning')
    }
  }

  /**
   * 停止自动做菜
   */
  function stop() {
    enabled.value = false
    if (loopTimer) {
      clearInterval(loopTimer)
      loopTimer = null
    }
    // 清空任务队列和厨具映射
    for (const key of Object.keys(taskQueue)) {
      delete taskQueue[key]
    }
    for (const key of Object.keys(applianceTaskMap)) {
      delete applianceTaskMap[key]
    }
  }

  // ========== 返回接口 ==========
  return {
    enabled,
    taskQueue,
    currentTask,
    toggle,
    stop
  }
}
