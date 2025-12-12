/**
 * 拖放辅助函数
 * Drag Drop Helpers
 * 
 * 共享的辅助函数
 */

import { useGameStore } from '../../stores/gameStore'
import { appliances } from '../../data/appliances'
import { preparedIngredients } from '../../data/ingredients'
import { APPLIANCE_STATUS } from '../../constants'

/**
 * 创建拖放辅助函数
 * @param {Object} options 配置选项
 * @param {Object} options.applianceStates - 厨具状态
 * @param {Object} options.inventory - 食材库存
 * @param {Ref} options.preparedItems - 备菜列表
 * @param {Function} options.showToast - 显示提示函数
 */
export function createDragDropHelpers(options) {
  const {
    applianceStates,
    inventory,
    preparedItems,
    showToast
  } = options

  const store = useGameStore()

  /**
   * 将 done 状态的厨具转换为 hasIngredients 状态
   * 成品会转为食材放入槽位
   */
  function convertDoneToIngredients(applianceId) {
    const appliance = applianceStates[applianceId]
    if (!appliance || appliance.status !== APPLIANCE_STATUS.DONE || !appliance.outputDish) return

    const outputDish = appliance.outputDish
    const outputCount = outputDish.count || 1

    // 判断是备菜还是成品菜
    const isPrepared = !!preparedIngredients[outputDish.id]
    const itemType = isPrepared ? 'prepared' : 'dish'

    // 清空当前状态
    appliance.ingredients = []
    appliance.outputDish = null
    appliance.burnProgress = 0
    appliance.progress = 0
    appliance.status = APPLIANCE_STATUS.HAS_INGREDIENTS

    // 将成品作为食材添加到槽位
    store.addIngredientToAppliance(applianceId, {
      id: outputDish.id,
      type: itemType,
      name: outputDish.name,
      icon: outputDish.icon,
      image: outputDish.image,
      count: outputCount,
      maxStack: outputCount
    })
  }

  /**
   * 处理物品丢入垃圾桶
   */
  function handleDropToTrashBin(item, trashBinId) {
    const trashBin = applianceStates[trashBinId]
    const trashBinData = appliances[trashBinId]

    if (!trashBin || trashBinData?.type !== 'trash') return

    // 检查垃圾桶容量
    const currentCount = trashBin.trashCount || 0
    const capacity = trashBinData.capacity || 20

    if (currentCount >= capacity) {
      showToast(`❌ 垃圾桶已满，请先清理`, 'error')
      return
    }

    // 根据来源处理
    if (item.source === 'inventory') {
      // 从食材库存丢入
      if ((inventory[item.id] || 0) <= 0) {
        showToast(`❌ ${item.name} 库存不足`, 'error')
        return
      }
      inventory[item.id]--
      store.addTrashToTrashBin(trashBinId, item)

    } else if (item.source === 'prepared_list') {
      // 从备菜区丢入
      const index = preparedItems.value.findIndex(p => p.id === item.id)
      if (index !== -1) {
        preparedItems.value.splice(index, 1)
        store.addTrashToTrashBin(trashBinId, item)
      }

    } else if (item.source === 'seasoning_bar') {
      // 调料丢入（不消耗库存，只是记录垃圾）
      store.addTrashToTrashBin(trashBinId, item)

    } else if (item.source === 'appliance') {
      // 从厨具丢入
      const sourceApplianceId = item.sourceApplianceId
      const slotIndex = item.sourceSlotIndex
      const sourceAppliance = applianceStates[sourceApplianceId]

      if (!sourceAppliance) return

      // 处理已完成的成品（从 outputDish）
      if (sourceAppliance.status === APPLIANCE_STATUS.DONE && sourceAppliance.outputDish) {
        const outputCount = sourceAppliance.outputDish.count || 1
        // 每个成品占用一个垃圾位
        for (let i = 0; i < outputCount; i++) {
          if ((trashBin.trashCount || 0) < capacity) {
            store.addTrashToTrashBin(trashBinId, item)
          }
        }
        store.resetAppliance(sourceApplianceId)
        return
      }

      // 处理槽位中的食材
      if (slotIndex !== null && sourceAppliance.ingredients[slotIndex]) {
        const ingredientData = sourceAppliance.ingredients[slotIndex]
        const currentIngCount = ingredientData.count || 1

        // 丢弃一个
        store.addTrashToTrashBin(trashBinId, item)

        // 处理堆叠
        if (currentIngCount > 1) {
          sourceAppliance.ingredients[slotIndex] = {
            ...ingredientData,
            count: currentIngCount - 1
          }
        } else {
          sourceAppliance.ingredients.splice(slotIndex, 1)
          if (sourceAppliance.ingredients.length === 0) {
            sourceAppliance.status = APPLIANCE_STATUS.IDLE
          }
        }
      }
    }
  }

  /**
   * 从厨具中移除单个食材（处理堆叠）
   */
  function removeOneFromAppliance(sourceAppliance, slotIndex) {
    if (!sourceAppliance || slotIndex === null) return false
    
    const ingredientData = sourceAppliance.ingredients[slotIndex]
    if (!ingredientData) return false
    
    const currentCount = ingredientData.count || 1
    
    if (currentCount > 1) {
      sourceAppliance.ingredients[slotIndex] = {
        ...ingredientData,
        count: currentCount - 1
      }
    } else {
      sourceAppliance.ingredients.splice(slotIndex, 1)
      if (sourceAppliance.ingredients.length === 0) {
        sourceAppliance.status = APPLIANCE_STATUS.IDLE
      }
    }
    
    return true
  }

  return {
    convertDoneToIngredients,
    handleDropToTrashBin,
    removeOneFromAppliance,
    store
  }
}
