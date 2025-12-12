/**
 * 物品拖拽启动模块
 * useItemDrag
 * 
 * 处理食材/备菜/调料/厨具内食材的拖拽开始
 */

import { ref, computed } from 'vue'
import { rawIngredients, preparedIngredients, seasonings } from '../../data/ingredients'
import {
  createDragData,
  serializeDragData,
  setDragImage,
  getItemAllowedAppliances
} from '../dragDropUtils'

/**
 * 物品拖拽
 * @param {Object} options 配置选项
 * @param {Object} options.inventory - 食材库存
 * @param {Function} options.onIngredientDragStart - 食材拖动开始回调（用于随机事件检查）
 */
export function useItemDrag(options) {
  const {
    inventory,
    onIngredientDragStart
  } = options

  // ========== 统一拖放状态 ==========
  const draggingItem = ref(null)
  
  // ========== 兼容旧状态 ==========
  const draggingIngredient = ref(null)
  const draggingPrepared = ref(null)
  const draggingSeasoning = ref(null)
  const draggingFromAppliance = ref(null)

  // ========== 计算属性 ==========
  
  // 是否正在拖拽物品
  const isDragging = computed(() => draggingItem.value !== null)
  
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

  // ========== 备菜拖拽 ==========

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

  // ========== 调料拖拽 ==========

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

  // ========== 清空状态 ==========
  
  // 清空所有拖拽状态
  function clearDragStates() {
    draggingItem.value = null
    draggingIngredient.value = null
    draggingPrepared.value = null
    draggingSeasoning.value = null
    draggingFromAppliance.value = null
  }

  return {
    // 统一状态（新）
    draggingItem,
    
    // 兼容旧状态
    draggingIngredient,
    draggingPrepared,
    draggingSeasoning,
    draggingFromAppliance,
    
    // 计算属性
    isDragging,
    isDraggingItemForPlate,
    currentDraggingAllowedAppliances,
    currentDraggingIngredientType,
    
    // 食材拖拽
    handleDragStart,
    handleDragEnd,
    
    // 备菜拖拽
    handlePreparedDragStart,
    handlePreparedDragEnd,
    
    // 调料拖拽
    handleSeasoningDragStart,
    handleSeasoningDragEnd,
    
    // 厨具中食材拖拽
    handleApplianceIngredientDragStart,
    handleApplianceIngredientDragEnd,
    
    // 辅助
    clearDragStates
  }
}
