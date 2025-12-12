/**
 * 厨具区域拖放模块
 * useApplianceDrop
 * 
 * 处理物品拖放到厨具的逻辑
 */

import { useGameStore } from '../../stores/gameStore'
import { appliances } from '../../data/appliances'
import { preparedIngredients } from '../../data/ingredients'
import {
  parseDragData,
  canDrop,
  DropTargets
} from '../dragDropUtils'

/**
 * 厨具区域拖放
 * @param {Object} options 配置选项
 * @param {Object} options.applianceStates - 厨具状态
 * @param {Object} options.inventory - 食材库存
 * @param {Ref} options.preparedItems - 备菜列表
 * @param {Function} options.showToast - 显示提示函数
 * @param {Function} options.getDraggingItem - 获取当前拖拽物品
 * @param {Function} options.isDraggingPlate - 是否正在拖拽盘子
 * @param {Object} options.helpers - 辅助函数（来自 dragDropHelpers）
 */
export function useApplianceDrop(options) {
  const {
    applianceStates,
    inventory,
    preparedItems,
    showToast,
    getDraggingItem,
    isDraggingPlate,
    helpers
  } = options

  const store = useGameStore()
  const { convertDoneToIngredients, handleDropToTrashBin } = helpers

  // 厨具区域的dragover事件
  function handleApplianceDragOver(e, applianceId) {
    e.preventDefault()
    const appliance = applianceStates[applianceId]
    const draggingItem = getDraggingItem()

    // 如果正在拖拽盘子，检查厨具是否已完成
    if (isDraggingPlate()) {
      if (appliance.status === 'done') {
        e.dataTransfer.dropEffect = 'move'
        e.currentTarget.classList.add('drag-over')
      } else {
        e.dataTransfer.dropEffect = 'none'
      }
      return
    }

    // 使用统一的 canDrop 判断
    if (draggingItem) {
      // 不能放回同一个厨具
      if (draggingItem.source === 'appliance' &&
          draggingItem.sourceApplianceId === applianceId) {
        e.dataTransfer.dropEffect = 'none'
        return
      }

      const result = canDrop(draggingItem, DropTargets.APPLIANCE, {
        applianceId,
        applianceStatus: appliance.status
      })

      if (result.canDrop) {
        e.dataTransfer.dropEffect = 'move'
        e.currentTarget.classList.add('drag-over')
      } else {
        e.dataTransfer.dropEffect = 'none'
        e.currentTarget.classList.add('drag-invalid')
      }
    }
  }

  // 离开厨具区域
  function handleApplianceDragLeave(e) {
    e.currentTarget.classList.remove('drag-over', 'drag-invalid')
  }

  // 放下食材到厨具
  function handleApplianceDrop(e, applianceId, handlePlateDropOnAppliance, clearDragStates) {
    e.preventDefault()
    e.currentTarget.classList.remove('drag-over', 'drag-invalid')

    const data = e.dataTransfer.getData('text/plain')

    // 如果是盘子拖到厨具上（装盘）
    if (data.startsWith('plate:')) {
      if (handlePlateDropOnAppliance) {
        handlePlateDropOnAppliance(applianceId)
      }
      return
    }

    const appliance = applianceStates[applianceId]
    const applianceData = appliances[applianceId]
    const status = appliance.status

    // 垃圾桶特殊处理：只允许 idle 和 hasIngredients 状态
    if (applianceData?.type === 'trash') {
      if (status !== 'idle' && status !== 'hasIngredients') return
    } else {
      // 普通厨具：允许 idle、hasIngredients 和 done 状态接收食材
      if (status !== 'idle' && status !== 'hasIngredients' && status !== 'done') return
    }

    // 尝试解析为统一JSON格式
    const item = parseDragData(data)

    if (item) {
      // 使用新的统一数据格式处理
      handleUnifiedDrop(item, applianceId)
    } else {
      // 兼容旧格式（逐步废弃）
      handleLegacyDrop(data, applianceId)
    }

    clearDragStates()
  }

  // 处理统一格式的拖放
  function handleUnifiedDrop(item, applianceId) {
    const targetAppData = appliances[applianceId]
    const targetAppName = targetAppData?.name || applianceId
    const appliance = applianceStates[applianceId]

    // 不能放回同一个厨具
    if (item.source === 'appliance' && item.sourceApplianceId === applianceId) {
      return
    }

    // 检查是否允许放入
    const dropResult = canDrop(item, DropTargets.APPLIANCE, {
      applianceId,
      applianceStatus: appliance.status
    })

    if (!dropResult.canDrop) {
      showToast(`❌ ${item.name} 不能放入${targetAppName}`, 'error')
      return
    }

    // 垃圾桶特殊处理
    if (targetAppData?.type === 'trash') {
      handleDropToTrashBin(item, applianceId)
      return
    }

    // 如果厨具是 done 状态，先将成品转为食材
    if (appliance.status === 'done' && appliance.outputDish) {
      convertDoneToIngredients(applianceId)
    }

    // 根据来源处理
    if (item.source === 'inventory') {
      // 从食材库存拖入
      if ((inventory[item.id] || 0) <= 0) {
        showToast(`❌ ${item.name} 库存不足`, 'error')
        return
      }

      const success = store.addIngredientToAppliance(applianceId, {
        id: item.id,
        type: item.type,
        icon: item.icon,
        name: item.name,
        image: item.image,
        maxStack: item.maxStack || 1
      })

      if (success) {
        inventory[item.id]--
        showToast(`✅ 将 ${item.name} 放入${targetAppName}`, 'success')
      } else {
        showToast(`❌ 厨具已满或堆叠上限`, 'error')
      }

    } else if (item.source === 'prepared_list') {
      // 从备菜区拖入
      const index = preparedItems.value.findIndex(p => p.id === item.id)
      if (index !== -1) {
        preparedItems.value.splice(index, 1)
        store.addIngredientToAppliance(applianceId, {
          id: item.id,
          type: item.type,
          icon: item.icon,
          name: item.name,
          image: item.image,
          maxStack: item.maxStack || 1
        })
        showToast(`✅ 将 ${item.name} 放入${targetAppName}`, 'success')
      }

    } else if (item.source === 'seasoning_bar') {
      // 从调料栏拖入
      store.addIngredientToAppliance(applianceId, {
        id: item.id,
        type: 'seasoning',
        icon: item.icon,
        name: item.name,
        image: item.image,
        maxStack: item.maxStack || 3
      })
      showToast(`✅ 添加了 ${item.name}`, 'success')

    } else if (item.source === 'appliance') {
      // 从另一个厨具拖入
      handleApplianceToApplianceDrop(item, applianceId, targetAppName)
    }
  }

  // 从厨具到厨具的拖放
  function handleApplianceToApplianceDrop(item, applianceId, targetAppName) {
    const sourceApplianceId = item.sourceApplianceId
    const slotIndex = item.sourceSlotIndex
    const sourceAppliance = applianceStates[sourceApplianceId]

    if (!sourceAppliance) return

    // 处理成品菜/备菜（从 outputDish 来）
    if (sourceAppliance.status === 'done' && sourceAppliance.outputDish) {
      const outputCount = sourceAppliance.outputDish.count || 1
      const success = store.addIngredientToAppliance(applianceId, {
        id: item.id,
        type: item.type,
        icon: item.icon,
        name: item.name,
        image: item.image,
        count: outputCount,  // 保留堆叠数量
        maxStack: item.maxStack || outputCount  // 堆叠上限
      })
      if (success) {
        store.resetAppliance(sourceApplianceId)
        const countText = outputCount > 1 ? ` x${outputCount}` : ''
        showToast(`✅ 将 ${item.name}${countText} 移到${targetAppName}继续加工`, 'success')
      } else {
        showToast(`❌ 厨具已满`, 'error')
      }
      return
    }

    // 处理普通食材（从 ingredients 槽位来）
    if (slotIndex !== null && sourceAppliance.ingredients[slotIndex]) {
      const ingredientData = sourceAppliance.ingredients[slotIndex]
      const currentCount = ingredientData.count || 1

      const singleItem = { ...ingredientData, count: 1 }
      const success = store.addIngredientToAppliance(applianceId, singleItem)

      if (success) {
        if (currentCount > 1) {
          sourceAppliance.ingredients[slotIndex] = {
            ...ingredientData,
            count: currentCount - 1
          }
        } else {
          sourceAppliance.ingredients.splice(slotIndex, 1)
          if (sourceAppliance.ingredients.length === 0) {
            sourceAppliance.status = 'idle'
          }
        }
        showToast(`✅ 将 ${item.name} 移到${targetAppName}`, 'success')
      } else {
        showToast(`❌ 厨具已满或堆叠上限`, 'error')
      }
    }
  }

  // 处理旧格式的拖放（兼容性，逐步废弃）
  function handleLegacyDrop(data, applianceId) {
    const targetAppData = appliances[applianceId]

    // 处理从厨具拖出的食材
    if (data.startsWith('appliance-ingredient:')) {
      const parts = data.split(':')
      const sourceApplianceId = parts[1]
      const slotIndex = parseInt(parts[2])

      if (sourceApplianceId === applianceId) return

      const sourceAppliance = applianceStates[sourceApplianceId]
      if (sourceAppliance && sourceAppliance.ingredients[slotIndex]) {
        const ingredientData = sourceAppliance.ingredients[slotIndex]
        const currentCount = ingredientData.count || 1

        // 垃圾桶特殊处理
        if (targetAppData?.type === 'trash') {
          const trashBin = applianceStates[applianceId]
          const capacity = targetAppData.capacity || 20
          if ((trashBin.trashCount || 0) >= capacity) {
            showToast(`❌ 垃圾桶已满，请先清理`, 'error')
            return
          }

          store.addTrashToTrashBin(applianceId, ingredientData)

          if (currentCount > 1) {
            sourceAppliance.ingredients[slotIndex] = {
              ...ingredientData,
              count: currentCount - 1
            }
          } else {
            sourceAppliance.ingredients.splice(slotIndex, 1)
            if (sourceAppliance.ingredients.length === 0) {
              sourceAppliance.status = 'idle'
            }
          }
          return
        }

        const singleItem = { ...ingredientData, count: 1 }
        const success = store.addIngredientToAppliance(applianceId, singleItem)

        if (success) {
          if (currentCount > 1) {
            sourceAppliance.ingredients[slotIndex] = {
              ...ingredientData,
              count: currentCount - 1
            }
          } else {
            sourceAppliance.ingredients.splice(slotIndex, 1)
            if (sourceAppliance.ingredients.length === 0) {
              sourceAppliance.status = 'idle'
            }
          }
        } else {
          showToast(`❌ 厨具已满或堆叠上限`, 'error')
        }
      }
      return
    }

    // 处理从厨具拖出的成品
    if (data.startsWith('appliance-dish:')) {
      const sourceApplianceId = data.replace('appliance-dish:', '')
      if (sourceApplianceId === applianceId) return

      const sourceAppliance = applianceStates[sourceApplianceId]
      if (sourceAppliance && sourceAppliance.status === 'done' && sourceAppliance.outputDish) {
        const dishData = sourceAppliance.outputDish
        const outputCount = dishData.count || 1
        const isPrepared = !!preparedIngredients[dishData.id]
        const itemType = isPrepared ? 'prepared' : 'dish'

        // 垃圾桶特殊处理
        if (targetAppData?.type === 'trash') {
          const trashBin = applianceStates[applianceId]
          const capacity = targetAppData.capacity || 20

          // 每个成品占用一个垃圾位
          for (let i = 0; i < outputCount; i++) {
            if ((trashBin.trashCount || 0) < capacity) {
              store.addTrashToTrashBin(applianceId, dishData)
            }
          }
          store.resetAppliance(sourceApplianceId)
          return
        }

        const success = store.addIngredientToAppliance(applianceId, {
          id: dishData.id,
          type: itemType,
          icon: dishData.icon,
          name: dishData.name,
          image: dishData.image,
          count: outputCount,  // 保留堆叠数量
          maxStack: outputCount  // 堆叠上限
        })
        if (success) {
          store.resetAppliance(sourceApplianceId)
        } else {
          showToast(`❌ 厨具已满`, 'error')
        }
      }
    }
  }

  return {
    handleApplianceDragOver,
    handleApplianceDragLeave,
    handleApplianceDrop
  }
}
