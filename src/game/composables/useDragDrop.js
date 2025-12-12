/**
 * 拖拽系统组合式函数
 * useDragDrop Composable
 * 
 * 管理所有拖拽相关的状态和事件处理
 * 
 * 重构版本：统一拖放数据格式 + 集中判断逻辑
 */

import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { rawIngredients, preparedIngredients, seasonings } from '../data/ingredients'
import { appliances } from '../data/appliances'
import {
  createDragData,
  serializeDragData,
  parseDragData,
  canDrop,
  getItemAllowedAppliances,
  getItemMaxStack,
  setDragImage,
  DropTargets
} from './dragDropUtils'

/**
 * 拖拽系统
 * @param {Object} options 配置选项
 * @param {Object} options.inventory - 食材库存
 * @param {Ref} options.preparedItems - 备菜列表
 * @param {Object} options.applianceStates - 厨具状态
 * @param {Object} options.userData - 用户数据
 * @param {Ref} options.plates - 盘子数据
 * @param {Ref} options.userApplianceLayout - 厨具布局
 * @param {Function} options.showToast - 显示提示函数
 * @param {Function} options.addItemToPlate - 添加食材到盘子
 * @param {Function} options.onIngredientDragStart - 食材拖动开始回调（用于随机事件检查）
 * @param {Function} options.onSeasoningDrop - 调料放入回调（用于随机事件检查）
 * @param {number} options.GRID_COLS - 网格列数
 * @param {number} options.GRID_ROWS - 网格行数
 */
export function useDragDrop(options) {
  const {
    inventory,
    preparedItems,
    applianceStates,
    userData,
    plates,
    userApplianceLayout,
    showToast,
    addItemToPlate,
    onIngredientDragStart,
    onSeasoningDrop,
    GRID_COLS = 10,
    GRID_ROWS = 5
  } = options

  const store = useGameStore()

  // ========== 统一拖放状态 ==========
  
  // 当前拖拽的物品（统一格式）
  const draggingItem = ref(null)
  
  // ========== 兼容旧状态（逐步废弃） ==========
  
  // 食材拖拽
  const draggingIngredient = ref(null)
  // 备菜拖拽
  const draggingPrepared = ref(null)
  // 调料拖拽
  const draggingSeasoning = ref(null)
  // 盘子拖拽
  const draggingPlateIndex = ref(-1)
  // 从厨具拖出的内容
  const draggingFromAppliance = ref(null)
  // 厨具布局拖拽
  const draggingAppliance = ref(null)
  // 拖拽预览位置
  const dragPreviewPos = ref(null)
  // 网格容器引用
  const gridRef = ref(null)

  // ========== 计算属性 ==========
  
  // 是否正在拖拽物品
  const isDragging = computed(() => draggingItem.value !== null)
  
  // 是否正在拖拽盘子
  const isDraggingPlate = computed(() => draggingPlateIndex.value >= 0)
  
  // 是否有食材正在拖拽（用于盘子组件）
  const isDraggingItemForPlate = computed(() => draggingItem.value !== null)
  
  // 当前拖拽物品允许的厨具列表
  const currentDraggingAllowedAppliances = computed(() => {
    if (!draggingItem.value) return []
    return getItemAllowedAppliances(draggingItem.value)
  })
  
  // 当前拖拽物品的类型
  const currentDraggingIngredientType = computed(() => {
    return draggingItem.value?.type || null
  })

  // ========== 厨具布局拖拽 ==========
  
  // 检查位置是否有效（不超出边界、不与其他厨具重叠）
  function isValidPosition(appId, newRow, newCol) {
    const app = userApplianceLayout.value.find(a => a.id === appId)
    if (!app) return false
    
    // 检查边界
    if (newRow < 1 || newCol < 1) return false
    if (newRow + app.height - 1 > GRID_ROWS) return false
    if (newCol + app.width - 1 > GRID_COLS) return false
    
    // 检查是否与其他厨具重叠
    for (const other of userApplianceLayout.value) {
      if (other.id === appId) continue
      
      const overlap = !(
        newCol + app.width <= other.col ||
        other.col + other.width <= newCol ||
        newRow + app.height <= other.row ||
        other.row + other.height <= newRow
      )
      if (overlap) return false
    }
    
    return true
  }

  // 开始拖拽厨具布局
  function handleApplianceLayoutDragStart(e, appId) {
    draggingAppliance.value = appId
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', `appliance:${appId}`)
    
    const applianceData = appliances[appId]
    const appLayout = userApplianceLayout.value.find(a => a.id === appId)
    
    const cellSize = 70
    const cardWidth = Math.max(80, (appLayout?.width || 2) * cellSize)
    const cardHeight = Math.max(80, (appLayout?.height || 2) * cellSize)
    
    const dragPreview = document.createElement('div')
    dragPreview.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      width: ${cardWidth}px;
      height: ${cardHeight}px;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #ffd700;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px;
      box-sizing: border-box;
      box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
      z-index: 9999;
      pointer-events: none;
    `
    
    const imgSize = Math.min(cardWidth, cardHeight) * 0.5
    
    if (applianceData?.image) {
      const img = document.createElement('img')
      img.src = applianceData.image
      img.style.cssText = `width: ${imgSize}px; height: ${imgSize}px; object-fit: contain;`
      dragPreview.appendChild(img)
    } else {
      const icon = document.createElement('span')
      icon.textContent = applianceData?.icon || '❓'
      icon.style.cssText = `font-size: ${imgSize * 0.8}px;`
      dragPreview.appendChild(icon)
    }
    
    const name = document.createElement('span')
    name.textContent = applianceData?.name || appId
    name.style.cssText = 'font-size: 12px; color: #fff; text-align: center; margin-top: 6px;'
    dragPreview.appendChild(name)
    
    document.body.appendChild(dragPreview)
    e.dataTransfer.setDragImage(dragPreview, cardWidth / 2, cardHeight / 2)
    setTimeout(() => document.body.removeChild(dragPreview), 0)
  }

  // 厨具布局拖拽结束
  function handleApplianceLayoutDragEnd(e) {
    if (draggingAppliance.value && dragPreviewPos.value) {
      const appIndex = userApplianceLayout.value.findIndex(a => a.id === draggingAppliance.value)
      if (appIndex !== -1 && isValidPosition(draggingAppliance.value, dragPreviewPos.value.row, dragPreviewPos.value.col)) {
        userApplianceLayout.value[appIndex].row = dragPreviewPos.value.row
        userApplianceLayout.value[appIndex].col = dragPreviewPos.value.col
      }
    }
    
    draggingAppliance.value = null
    dragPreviewPos.value = null
  }

  // 网格上的dragover事件
  function handleGridDragOver(e) {
    if (!draggingAppliance.value || !gridRef.value) return
    e.preventDefault()
    
    const rect = gridRef.value.getBoundingClientRect()
    const cellWidth = rect.width / GRID_COLS
    const cellHeight = 80 + 6
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const col = Math.floor(x / cellWidth) + 1
    const row = Math.floor(y / cellHeight) + 1
    
    if (row >= 1 && row <= GRID_ROWS && col >= 1 && col <= GRID_COLS) {
      dragPreviewPos.value = { row, col }
    }
  }

  // 网格上的drop事件
  function handleGridDrop(e) {
    e.preventDefault()
  }

  // 获取拖拽预览的样式
  const dragPreviewStyle = computed(() => {
    if (!draggingAppliance.value || !dragPreviewPos.value) return null
    
    const app = userApplianceLayout.value.find(a => a.id === draggingAppliance.value)
    if (!app) return null
    
    const isValid = isValidPosition(app.id, dragPreviewPos.value.row, dragPreviewPos.value.col)
    
    return {
      gridArea: `${dragPreviewPos.value.row} / ${dragPreviewPos.value.col} / ${dragPreviewPos.value.row + app.height} / ${dragPreviewPos.value.col + app.width}`,
      isValid
    }
  })

  // ========== 食材拖拽 ==========
  
  // 开始拖拽食材
  function handleDragStart(e, ingredientId) {
    const ingredient = rawIngredients[ingredientId]
    if (!ingredient) return
    
    // 检查是否触发食材掉落事件
    if (onIngredientDragStart) {
      const dropped = onIngredientDragStart(ingredient)
      if (dropped) {
        // 食材掉落了，取消拖动并扣除库存
        e.preventDefault()
        if (inventory[ingredientId] > 0) {
          inventory[ingredientId]--
        }
        return
      }
    }
    
    // 创建统一拖放数据
    const item = createDragData({
      type: 'ingredient',
      id: ingredientId,
      source: 'inventory',
      name: ingredient.name,
      icon: ingredient.icon,
      image: ingredient.image,
      maxStack: ingredient.maxStack || 1
    })
    
    draggingItem.value = item
    draggingIngredient.value = ingredientId  // 兼容旧代码
    
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', serializeDragData(item))
    setDragImage(e, item)
    e.target.classList.add('dragging')
  }

  // 拖拽结束
  function handleDragEnd(e) {
    draggingItem.value = null
    draggingIngredient.value = null
    draggingPrepared.value = null
    draggingFromAppliance.value = null
    e.target.classList.remove('dragging')
  }

  // 开始拖拽备菜
  function handlePreparedDragStart(e, preparedId) {
    const prepared = preparedIngredients[preparedId]
    if (!prepared) return
    
    const item = createDragData({
      type: 'prepared',
      id: preparedId,
      source: 'prepared_list',
      name: prepared.name,
      icon: prepared.icon,
      image: prepared.image,
      maxStack: prepared.maxStack || 1
    })
    
    draggingItem.value = item
    draggingPrepared.value = preparedId  // 兼容旧代码
  }

  // 备菜拖拽结束
  function handlePreparedDragEnd(e) {
    draggingItem.value = null
    draggingPrepared.value = null
  }

  // 开始拖拽调料
  function handleSeasoningDragStart(e, seasoningId) {
    const seasoning = seasonings[seasoningId]
    if (!seasoning) return
    
    const item = createDragData({
      type: 'seasoning',
      id: seasoningId,
      source: 'seasoning_bar',
      name: seasoning.name,
      icon: seasoning.icon,
      image: seasoning.image
    })
    
    draggingItem.value = item
    draggingSeasoning.value = seasoningId  // 兼容旧代码
  }

  // 调料拖拽结束
  function handleSeasoningDragEnd(e) {
    draggingItem.value = null
    draggingSeasoning.value = null
  }

  // ========== 厨具中食材拖拽 ==========
  
  // 厨具中食材/成品拖拽开始
  function handleApplianceIngredientDragStart(dragData) {
    // dragData 来自 ApplianceItem 组件：{ type, applianceId, slotIndex, content }
    const content = dragData.content
    
    const item = createDragData({
      type: content.type || 'ingredient',
      id: content.id,
      source: 'appliance',
      sourceApplianceId: dragData.applianceId,
      sourceSlotIndex: dragData.slotIndex,
      name: content.name,
      icon: content.icon,
      image: content.image,
      count: content.count || 1,
      maxStack: content.maxStack || 1
    })
    
    draggingItem.value = item
    draggingFromAppliance.value = dragData  // 兼容旧代码
  }

  // 厨具中食材/成品拖拽结束
  function handleApplianceIngredientDragEnd() {
    draggingItem.value = null
    draggingFromAppliance.value = null
  }

  // ========== 厨具区域拖放 ==========
  
  // 厨具区域的dragover事件
  function handleApplianceDragOver(e, applianceId) {
    e.preventDefault()
    const appliance = applianceStates[applianceId]
    
    // 如果正在拖拽盘子，检查厨具是否已完成
    if (isDraggingPlate.value) {
      if (appliance.status === 'done') {
        e.dataTransfer.dropEffect = 'move'
        e.currentTarget.classList.add('drag-over')
      } else {
        e.dataTransfer.dropEffect = 'none'
      }
      return
    }
    
    // 使用统一的 canDrop 判断
    if (draggingItem.value) {
      // 不能放回同一个厨具
      if (draggingItem.value.source === 'appliance' && 
          draggingItem.value.sourceApplianceId === applianceId) {
        e.dataTransfer.dropEffect = 'none'
        return
      }
      
      const result = canDrop(draggingItem.value, DropTargets.APPLIANCE, {
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
  function handleApplianceDrop(e, applianceId, handlePlateDropOnAppliance) {
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
          draggingFromAppliance.value = null
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
      draggingFromAppliance.value = null
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
          draggingFromAppliance.value = null
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
      draggingFromAppliance.value = null
    }
  }

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
    if (!plate || plate.status !== 'empty') {
      showToast('❌ 盘子已有菜品', 'error')
      return
    }
    
    let item = null
    
    // 盘子现在只能接收成品菜（从厨具拖出的完成品）
    // 从厨具拖出的成品
    if (data.startsWith('appliance-dish:')) {
      const sourceApplianceId = data.replace('appliance-dish:', '')
      const sourceAppliance = applianceStates[sourceApplianceId]
      if (sourceAppliance && sourceAppliance.status === 'done' && sourceAppliance.outputDish) {
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
    // 使用统一的 canDrop 判断
    if (draggingItem.value && draggingItem.value.source === 'appliance') {
      const result = canDrop(draggingItem.value, DropTargets.PREPARED_LIST)
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
    
    // 优先使用统一格式
    if (draggingItem.value && draggingItem.value.source === 'appliance') {
      const item = draggingItem.value
      const sourceApplianceId = item.sourceApplianceId
      const slotIndex = item.sourceSlotIndex
      const sourceAppliance = applianceStates[sourceApplianceId]
      
      if (!sourceAppliance) {
        clearDragStates()
        return
      }
      
      // 处理已完成的成品（从 outputDish）
      if (sourceAppliance.status === 'done' && sourceAppliance.outputDish) {
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
        const countText = outputCount > 1 ? ` x${outputCount}` : ''
        showToast(`✅ 将 ${item.name}${countText} 放入备菜区`, 'success')
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
            sourceAppliance.status = 'idle'
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
            sourceAppliance.status = 'idle'
          }
        }
      }
      draggingFromAppliance.value = null
      return
    }
    
    if (data.startsWith('appliance-dish:')) {
      const sourceApplianceId = data.replace('appliance-dish:', '')
      const sourceAppliance = applianceStates[sourceApplianceId]
      
      if (sourceAppliance && sourceAppliance.status === 'done' && sourceAppliance.outputDish) {
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
      draggingFromAppliance.value = null
    }
  }

  // ========== 食材区域拖放 ==========
  
  // 食材区域 dragover
  function handleIngredientsSectionDragOver(e) {
    // 使用统一的 canDrop 判断
    if (draggingItem.value && draggingItem.value.source === 'appliance') {
      const result = canDrop(draggingItem.value, DropTargets.INVENTORY)
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
    
    // 优先使用统一格式
    if (draggingItem.value && draggingItem.value.source === 'appliance') {
      const item = draggingItem.value
      
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
            sourceAppliance.status = 'idle'
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
              sourceAppliance.status = 'idle'
            }
          }
        } else {
          showToast(`❌ 只有生食材才能退回库存`, 'error')
        }
      }
      draggingFromAppliance.value = null
    }
  }

  // ========== 辅助函数 ==========
  
  /**
   * 将 done 状态的厨具转换为 hasIngredients 状态
   * 成品会转为食材放入槽位
   */
  function convertDoneToIngredients(applianceId) {
    const appliance = applianceStates[applianceId]
    if (!appliance || appliance.status !== 'done' || !appliance.outputDish) return
    
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
    appliance.status = 'hasIngredients'
    
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
      // 从厦具丢入
      const sourceApplianceId = item.sourceApplianceId
      const slotIndex = item.sourceSlotIndex
      const sourceAppliance = applianceStates[sourceApplianceId]
      
      if (!sourceAppliance) return
      
      // 处理已完成的成品（从 outputDish）
      if (sourceAppliance.status === 'done' && sourceAppliance.outputDish) {
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
            sourceAppliance.status = 'idle'
          }
        }
      }
    }
  }
  
  // 清空所有拖拽状态
  function clearDragStates() {
    draggingItem.value = null
    draggingIngredient.value = null
    draggingPrepared.value = null
    draggingSeasoning.value = null
    draggingFromAppliance.value = null
  }

  // ========== 返回接口 ==========
  
  return {
    // 统一状态（新）
    draggingItem,
    
    // 兼容旧状态
    draggingIngredient,
    draggingPrepared,
    draggingSeasoning,
    draggingPlateIndex,
    draggingFromAppliance,
    draggingAppliance,
    dragPreviewPos,
    gridRef,
    
    // 计算属性
    isDragging,
    isDraggingPlate,
    isDraggingItemForPlate,
    dragPreviewStyle,
    currentDraggingAllowedAppliances,
    currentDraggingIngredientType,
    
    // 厨具布局拖拽
    isValidPosition,
    handleApplianceLayoutDragStart,
    handleApplianceLayoutDragEnd,
    handleGridDragOver,
    handleGridDrop,
    
    // 食材拖拽
    handleDragStart,
    handleDragEnd,
    handlePreparedDragStart,
    handlePreparedDragEnd,
    handleSeasoningDragStart,
    handleSeasoningDragEnd,
    
    // 厨具中食材拖拽
    handleApplianceIngredientDragStart,
    handleApplianceIngredientDragEnd,
    
    // 厨具区域拖放
    handleApplianceDragOver,
    handleApplianceDragLeave,
    handleApplianceDrop,
    
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
    handleIngredientsSectionDrop,
    
    // 辅助函数
    clearDragStates
  }
}

export default useDragDrop
