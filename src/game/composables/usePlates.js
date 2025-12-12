/**
 * 盘子系统组合式函数
 * usePlates Composable
 * 
 * 管理盘子状态、清洗、装盘、上菜等功能
 */
import { ref, onUnmounted } from 'vue'
import { PLATE_STATUS, APPLIANCE_STATUS } from '../constants'
import { useGameStore } from '../stores/gameStore'

/**
 * 盘子系统
 * @param {Object} options 配置选项
 * @param {Object} options.userData - 用户数据（包含 plates 数量）
 * @param {Object} options.randomEventsSystem - 随机事件系统
 * @param {Function} options.showToast - 显示提示函数
 * @param {Function} options.serveCustomer - 上菜函数
 * @param {Ref} options.customers - 顾客列表
 * @param {Object} options.applianceStates - 厨具状态
 */
export function usePlates(options) {
  const {
    userData,
    randomEventsSystem,
    showToast,
    serveCustomer,
    customers,
    applianceStates
  } = options

  const store = useGameStore()

  // ========== 盘子状态 ==========
  // status: PLATE_STATUS.EMPTY | PLATE_STATUS.HAS_DISH | PLATE_STATUS.DIRTY | PLATE_STATUS.WASHING
  const plates = ref([])

  // 清洗定时器
  let plateWashTimer = null

  // ========== 初始化 ==========

  /**
   * 初始化盘子数组
   */
  function initPlates() {
    plates.value = Array.from({ length: userData.plates }, () => ({
      status: PLATE_STATUS.EMPTY,
      dish: null
    }))
  }

  // 立即初始化
  initPlates()

  // ========== 清洗系统 ==========

  /**
   * 启动清洗循环
   */
  function startWashingLoop() {
    if (plateWashTimer) return
    plateWashTimer = setInterval(() => {
      updatePlateWashing()
    }, 100)
  }

  /**
   * 停止清洗循环
   */
  function stopWashingLoop() {
    if (plateWashTimer) {
      clearInterval(plateWashTimer)
      plateWashTimer = null
    }
  }

  /**
   * 开始清洗盘子
   * @param {number} plateIndex - 盘子索引
   */
  function handlePlateWash(plateIndex) {
    const plate = plates.value[plateIndex]
    if (!plate || plate.status !== PLATE_STATUS.DIRTY) return

    plates.value[plateIndex] = {
      status: PLATE_STATUS.WASHING,
      dish: null,
      washProgress: 0,
      washStartTime: Date.now(),
      washDuration: 2000
    }

    startWashingLoop()
  }

  /**
   * 更新盘子清洗进度
   */
  function updatePlateWashing() {
    let hasWashingPlates = false

    plates.value.forEach((plate, index) => {
      if (plate.status === PLATE_STATUS.WASHING) {
        hasWashingPlates = true
        const elapsed = Date.now() - plate.washStartTime
        const progress = Math.min(100, (elapsed / plate.washDuration) * 100)
        plate.washProgress = progress

        // 检查是否触发盘子摔碎事件
        if (randomEventsSystem?.checkPlateBreak?.(index)) {
          plates.value.splice(index, 1)
          if (userData.plates > 0) {
            userData.plates--
          }
          return
        }

        // 清洗完成
        if (progress >= 100) {
          plates.value[index] = {
            status: PLATE_STATUS.EMPTY,
            dish: null
          }
        }
      }
    })

    if (!hasWashingPlates) {
      stopWashingLoop()
    }
  }

  // ========== 盘子操作 ==========

  /**
   * 清空指定盘子
   * @param {number} plateIndex - 盘子索引
   */
  function handlePlateClear(plateIndex) {
    const plate = plates.value[plateIndex]
    if (!plate || plate.status === PLATE_STATUS.EMPTY) return

    plates.value[plateIndex] = {
      status: PLATE_STATUS.EMPTY,
      dish: null
    }
  }

  /**
   * 向盘子添加成品菜
   * @param {number} plateIndex - 盘子索引
   * @param {Object} dish - 菜品对象
   * @returns {boolean} 是否成功
   */
  function addDishToPlate(plateIndex, dish) {
    const plate = plates.value[plateIndex]
    if (!plate || plate.status !== PLATE_STATUS.EMPTY) return false

    plate.status = PLATE_STATUS.HAS_DISH
    plate.dish = {
      id: dish.id,
      name: dish.name,
      icon: dish.icon,
      image: dish.image
    }

    return true
  }

  /**
   * 向盘子添加食材（兼容旧接口）
   * @param {number} plateIndex - 盘子索引
   * @param {Object} item - 物品对象
   * @returns {boolean} 是否成功
   */
  function addItemToPlate(plateIndex, item) {
    return addDishToPlate(plateIndex, item)
  }

  /**
   * 上菜给顾客
   * @param {number} plateIndex - 盘子索引
   * @param {Object} customer - 顾客对象
   */
  function handleServeDish(plateIndex, customer) {
    const plate = plates.value[plateIndex]
    if (!plate || plate.status !== PLATE_STATUS.HAS_DISH || !plate.dish) {
      showToast?.('❌ 盘子里没有菜品', 'error')
      return
    }

    // 检查是否触发菜撒事件
    if (randomEventsSystem?.checkPlateSpill?.(plate, plateIndex)) {
      plates.value[plateIndex] = {
        status: PLATE_STATUS.DIRTY,
        dish: null
      }
      return
    }

    // 找到顾客的索引
    const customerIndex = customers.value.findIndex(c => c.id === customer.id)
    if (customerIndex < 0) {
      showToast?.('❌ 顾客已离开', 'error')
      return
    }

    // 尝试上菜
    const result = serveCustomer?.(customerIndex, plate.dish.id)
    if (result) {
      plates.value[plateIndex] = {
        status: PLATE_STATUS.DIRTY,
        dish: null
      }
    }
  }

  /**
   * 盘子拖放到厨具上（装盘）
   * @param {string} applianceId - 厨具ID
   * @param {number} draggingPlateIndex - 拖拽的盘子索引
   */
  function handlePlateDropOnAppliance(applianceId, draggingPlateIndex) {
    if (draggingPlateIndex < 0) return

    const plate = plates.value[draggingPlateIndex]
    if (!plate || plate.status !== PLATE_STATUS.EMPTY) {
      showToast?.('❌ 盘子已有菜品', 'error')
      return
    }

    const appliance = applianceStates[applianceId]
    if (!appliance || appliance.status !== APPLIANCE_STATUS.DONE) {
      showToast?.('❌ 厨具还没做好', 'error')
      return
    }

    // 获取成品
    const dish = store.serveDish(applianceId)
    if (!dish) {
      showToast?.('❌ 无法装盘', 'error')
      return
    }

    // 装盘
    addDishToPlate(draggingPlateIndex, dish)
  }

  // ========== 清理 ==========

  onUnmounted(() => {
    stopWashingLoop()
  })

  // ========== 返回接口 ==========

  return {
    // 状态
    plates,

    // 初始化
    initPlates,

    // 清洗系统
    handlePlateWash,
    startWashingLoop,
    stopWashingLoop,

    // 盘子操作
    handlePlateClear,
    addDishToPlate,
    addItemToPlate,
    handleServeDish,
    handlePlateDropOnAppliance
  }
}

export default usePlates
