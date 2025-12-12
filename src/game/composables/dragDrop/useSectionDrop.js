/**
 * 区域拖放模块
 * useSectionDrop
 * 
 * 处理盘子拖放、备菜区拖放、食材区拖放
 */

import { ref, computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { APPLIANCE_STATUS, PLATE_STATUS } from '../../constants'
import {
  canDrop,
  DropTargets
} from '../dragDropUtils'

/**
 * 区域拖放
 * @param {Object} options 配置选项
 * @param {Object} options.applianceStates - 厨具状态
 * @param {Object} options.inventory - 食材库存
 * @param {Ref} options.preparedItems - 备菜列表
 * @param {Ref} options.plates - 盘子列表
 * @param {Function} options.showToast - 显示提示函数
 * @param {Function} options.addItemToPlate - 添加食材到盘子
 * @param {Function} options.getDraggingItem - 获取当前拖拽物品
 * @param {Function} options.clearDragStates - 清空拖拽状态
 */
export function useSectionDrop(options) {
  const {
    applianceStates,
    inventory,
    preparedItems,
    plates,
    showToast,
    addItemToPlate,
    getDraggingItem,
    clearDragStates
  } = options

  const store = useGameStore()

  // ========== 盘子拖放状态 ==========
  const draggingPlateIndex = ref(-1)
  
  // 是否正在拖拽盘子
  const isDraggingPlate = computed(() => draggingPlateIndex.value >= 0)

  // ========== 盘子拖放 ==========
  
  // 盘子拖拽开始
  function handlePlateDragStart(plateIndex) {
    draggingPlateIndex.value = plateIndex
  }

  // 盘子拖拽结束
  function handlePlateDragEnd() {
    draggingPlateIndex.value = -1
  }

  // 食材放到盘子上
  function handlePlateDropItem(e, plateIndex) {
    const data = e.dataTransfer.getData('text/plain')
    const plate = plates.value[plateIndex]

    // 盘子现在只能装一个成品菜，只有空盘可以接收
    if (!plate || plate.status !== PLATE_STATUS.EMPTY) {
      showToast('❌ 盘子已有菜品', 'error')
      return
    }

    let item = null

    // 盘子现在只能接收成品菜（从厨具拖出的完成品）
    // 从厨具拖出的成品
    if (data.startsWith('appliance-dish:')) {
      const sourceApplianceId = data.replace('appliance-dish:', '')
      const sourceAppliance = applianceStates[sourceApplianceId]
      if (sourceAppliance && sourceAppliance.status === APPLIANCE_STATUS.DONE && sourceAppliance.outputDish) {
        const dishData = sourceAppliance.outputDish
        const currentCount = dishData.count || 1

        item = {
          id: dishData.id,
          name: dishData.name,
          icon: dishData.icon,
          image: dishData.image
        }

        // 处理堆叠数量：只装1份，剩余保留在厨具
        if (currentCount > 1) {
          sourceAppliance.outputDish = {
            ...dishData,
            count: currentCount - 1
          }
        } else {
          store.resetAppliance(sourceApplianceId)
        }
      }
    } else {
      // 其他类型不能放入盘子
      showToast('❌ 盘子只能装成品菜', 'error')
      return
    }

    if (item) {
      addItemToPlate(plateIndex, item)
    }

    clearDragStates()
  }

  // ========== 备菜区域拖放 ==========

  // 备菜区域 dragover
  function handlePreparedSectionDragOver(e) {
    const draggingItem = getDraggingItem()
    // 使用统一的 canDrop 判断
    if (draggingItem && draggingItem.source === 'appliance') {
      const result = canDrop(draggingItem, DropTargets.PREPARED_LIST)
      if (result.canDrop) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        e.currentTarget.classList.add('drag-over')
      }
    }
  }

  // 备菜区域 dragleave
  function handlePreparedSectionDragLeave(e) {
    e.currentTarget.classList.remove('drag-over')
  }

  // 备菜区域 drop
  function handlePreparedSectionDrop(e) {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')

    const draggingItem = getDraggingItem()
    
    // 优先使用统一格式
    if (draggingItem && draggingItem.source === 'appliance') {
      const item = draggingItem
      const sourceApplianceId = item.sourceApplianceId
      const slotIndex = item.sourceSlotIndex
      const sourceAppliance = applianceStates[sourceApplianceId]

      if (!sourceAppliance) {
        clearDragStates()
        return
      }

      // 处理已完成的成品（从 outputDish）
      if (sourceAppliance.status === APPLIANCE_STATUS.DONE && sourceAppliance.outputDish) {
        const outputCount = sourceAppliance.outputDish.count || 1

        // 根据 count 产出多个备菜
        for (let i = 0; i < outputCount; i++) {
          preparedItems.value.push({
            id: item.id,
            name: item.name,
            icon: item.icon,
            image: item.image
          })
        }

        store.resetAppliance(sourceApplianceId)
        clearDragStates()
        return
      }

      // 处理槽位中的食材
      if (slotIndex !== null && sourceAppliance.ingredients[slotIndex]) {
        const ingredientData = sourceAppliance.ingredients[slotIndex]
        const currentCount = ingredientData.count || 1

        if (item.type === 'ingredient') {
          // 生食材退回库存
          inventory[item.id] = (inventory[item.id] || 0) + 1
        } else if (item.type === 'seasoning') {
          // 调料丢弃
        } else {
          // 备菜/成品放入备菜区
          preparedItems.value.push({
            id: item.id,
            name: item.name,
            icon: item.icon,
            image: item.image
          })
        }

        // 处理堆叠
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
      }

      clearDragStates()
      return
    }

    // 兼容旧格式（逐步废弃）
    const data = e.dataTransfer.getData('text/plain')
    handlePreparedSectionLegacyDrop(data)
  }

  // 备菜区旧格式处理（兼容性）
  function handlePreparedSectionLegacyDrop(data) {
    if (data.startsWith('appliance-ingredient:')) {
      const parts = data.split(':')
      const sourceApplianceId = parts[1]
      const slotIndex = parseInt(parts[2])

      const sourceAppliance = applianceStates[sourceApplianceId]
      if (sourceAppliance && sourceAppliance.ingredients[slotIndex]) {
        const ingredientData = sourceAppliance.ingredients[slotIndex]
        const currentCount = ingredientData.count || 1

        if (ingredientData.type === 'ingredient') {
          inventory[ingredientData.id] = (inventory[ingredientData.id] || 0) + 1
        } else if (ingredientData.type === 'seasoning') {
          // 调料丢弃
        } else {
          preparedItems.value.push({
            id: ingredientData.id,
            name: ingredientData.name,
            icon: ingredientData.icon,
            image: ingredientData.image
          })
        }

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
      }
      return
    }

    if (data.startsWith('appliance-dish:')) {
      const sourceApplianceId = data.replace('appliance-dish:', '')
      const sourceAppliance = applianceStates[sourceApplianceId]

      if (sourceAppliance && sourceAppliance.status === APPLIANCE_STATUS.DONE && sourceAppliance.outputDish) {
        const dishData = sourceAppliance.outputDish
        const outputCount = dishData.count || 1

        // 根据 count 产出多个备菜
        for (let i = 0; i < outputCount; i++) {
          preparedItems.value.push({
            id: dishData.id,
            name: dishData.name,
            icon: dishData.icon,
            image: dishData.image
          })
        }

        store.resetAppliance(sourceApplianceId)
      }
    }
  }

  // ========== 食材区域拖放 ==========

  // 食材区域 dragover
  function handleIngredientsSectionDragOver(e) {
    const draggingItem = getDraggingItem()
    // 使用统一的 canDrop 判断
    if (draggingItem && draggingItem.source === 'appliance') {
      const result = canDrop(draggingItem, DropTargets.INVENTORY)
      if (result.canDrop) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        e.currentTarget.classList.add('drag-over')
      }
    }
  }

  // 食材区域 dragleave
  function handleIngredientsSectionDragLeave(e) {
    e.currentTarget.classList.remove('drag-over')
  }

  // 食材区域 drop
  function handleIngredientsSectionDrop(e) {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over')

    const draggingItem = getDraggingItem()
    
    // 优先使用统一格式
    if (draggingItem && draggingItem.source === 'appliance') {
      const item = draggingItem

      // 只有生食材才能退回库存
      if (item.type !== 'ingredient') {
        showToast(`❌ 只有生食材才能退回库存`, 'error')
        clearDragStates()
        return
      }

      const sourceApplianceId = item.sourceApplianceId
      const slotIndex = item.sourceSlotIndex
      const sourceAppliance = applianceStates[sourceApplianceId]

      if (sourceAppliance && slotIndex !== null && sourceAppliance.ingredients[slotIndex]) {
        const ingredientData = sourceAppliance.ingredients[slotIndex]
        const currentCount = ingredientData.count || 1

        // 退回库存
        inventory[item.id] = (inventory[item.id] || 0) + 1

        // 处理堆叠
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
      }

      clearDragStates()
      return
    }

    // 兼容旧格式（逐步废弃）
    const data = e.dataTransfer.getData('text/plain')

    if (data.startsWith('appliance-ingredient:')) {
      const parts = data.split(':')
      const sourceApplianceId = parts[1]
      const slotIndex = parseInt(parts[2])

      const sourceAppliance = applianceStates[sourceApplianceId]
      if (sourceAppliance && sourceAppliance.ingredients[slotIndex]) {
        const ingredientData = sourceAppliance.ingredients[slotIndex]
        const currentCount = ingredientData.count || 1

        if (ingredientData.type === 'ingredient') {
          inventory[ingredientData.id] = (inventory[ingredientData.id] || 0) + 1

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
        } else {
          showToast(`❌ 只有生食材才能退回库存`, 'error')
        }
      }
    }
  }

  return {
    // 盘子状态
    draggingPlateIndex,
    isDraggingPlate,
    
    // 盘子拖放
    handlePlateDragStart,
    handlePlateDragEnd,
    handlePlateDropItem,
    
    // 备菜区域拖放
    handlePreparedSectionDragOver,
    handlePreparedSectionDragLeave,
    handlePreparedSectionDrop,
    
    // 食材区域拖放
    handleIngredientsSectionDragOver,
    handleIngredientsSectionDragLeave,
    handleIngredientsSectionDrop
  }
}
