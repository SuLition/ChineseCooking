/**
 * 拖拽系统组合式函数
 * useDragDrop Composable
 * 
 * 管理所有拖拽相关的状态和事件处理
 * 
 * 重构版本：模块化拆分
 * - useLayoutDrag: 厨具布局拖拽
 * - useItemDrag: 物品拖拽启动
 * - useApplianceDrop: 厨具区域拖放
 * - useSectionDrop: 备菜区/食材区/盘子拖放
 * - dragDropHelpers: 辅助函数
 */

import {
  createDragDropHelpers,
  useLayoutDrag,
  useItemDrag,
  useApplianceDrop,
  useSectionDrop
} from './dragDrop'

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

  // ========== 创建辅助函数 ==========
  const helpers = createDragDropHelpers({
    applianceStates,
    inventory,
    preparedItems,
    showToast
  })

  // ========== 厨具布局拖拽 ==========
  const layoutDrag = useLayoutDrag({
    userApplianceLayout,
    GRID_COLS,
    GRID_ROWS
  })

  // ========== 物品拖拽启动 ==========
  const itemDrag = useItemDrag({
    inventory,
    onIngredientDragStart
  })

  // ========== 区域拖放（盘子/备菜区/食材区） ==========
  const sectionDrop = useSectionDrop({
    applianceStates,
    inventory,
    preparedItems,
    plates,
    showToast,
    addItemToPlate,
    getDraggingItem: () => itemDrag.draggingItem.value,
    clearDragStates: () => itemDrag.clearDragStates()
  })

  // ========== 厨具区域拖放 ==========
  const applianceDrop = useApplianceDrop({
    applianceStates,
    inventory,
    preparedItems,
    showToast,
    getDraggingItem: () => itemDrag.draggingItem.value,
    isDraggingPlate: () => sectionDrop.isDraggingPlate.value,
    helpers
  })

  // ========== 包装厨具拖放方法 ==========
  
  // 包装 handleApplianceDrop，传入清空状态回调
  function handleApplianceDropWrapper(e, applianceId, handlePlateDropOnAppliance) {
    applianceDrop.handleApplianceDrop(e, applianceId, handlePlateDropOnAppliance, () => itemDrag.clearDragStates())
  }

  // ========== 返回接口 ==========
  
  return {
    // 统一状态（新）
    draggingItem: itemDrag.draggingItem,
    
    // 兼容旧状态
    draggingIngredient: itemDrag.draggingIngredient,
    draggingPrepared: itemDrag.draggingPrepared,
    draggingSeasoning: itemDrag.draggingSeasoning,
    draggingPlateIndex: sectionDrop.draggingPlateIndex,
    draggingFromAppliance: itemDrag.draggingFromAppliance,
    draggingAppliance: layoutDrag.draggingAppliance,
    dragPreviewPos: layoutDrag.dragPreviewPos,
    gridRef: layoutDrag.gridRef,
    
    // 计算属性
    isDragging: itemDrag.isDragging,
    isDraggingPlate: sectionDrop.isDraggingPlate,
    isDraggingItemForPlate: itemDrag.isDraggingItemForPlate,
    dragPreviewStyle: layoutDrag.dragPreviewStyle,
    currentDraggingAllowedAppliances: itemDrag.currentDraggingAllowedAppliances,
    currentDraggingIngredientType: itemDrag.currentDraggingIngredientType,
    
    // 厨具布局拖拽
    isValidPosition: layoutDrag.isValidPosition,
    handleApplianceLayoutDragStart: layoutDrag.handleApplianceLayoutDragStart,
    handleApplianceLayoutDragEnd: layoutDrag.handleApplianceLayoutDragEnd,
    handleGridDragOver: layoutDrag.handleGridDragOver,
    handleGridDrop: layoutDrag.handleGridDrop,
    
    // 食材拖拽
    handleDragStart: itemDrag.handleDragStart,
    handleDragEnd: itemDrag.handleDragEnd,
    handlePreparedDragStart: itemDrag.handlePreparedDragStart,
    handlePreparedDragEnd: itemDrag.handlePreparedDragEnd,
    handleSeasoningDragStart: itemDrag.handleSeasoningDragStart,
    handleSeasoningDragEnd: itemDrag.handleSeasoningDragEnd,
    
    // 厨具中食材拖拽
    handleApplianceIngredientDragStart: itemDrag.handleApplianceIngredientDragStart,
    handleApplianceIngredientDragEnd: itemDrag.handleApplianceIngredientDragEnd,
    
    // 厨具区域拖放
    handleApplianceDragOver: applianceDrop.handleApplianceDragOver,
    handleApplianceDragLeave: applianceDrop.handleApplianceDragLeave,
    handleApplianceDrop: handleApplianceDropWrapper,
    
    // 盘子拖放
    handlePlateDragStart: sectionDrop.handlePlateDragStart,
    handlePlateDragEnd: sectionDrop.handlePlateDragEnd,
    handlePlateDropItem: sectionDrop.handlePlateDropItem,
    
    // 备菜区域拖放
    handlePreparedSectionDragOver: sectionDrop.handlePreparedSectionDragOver,
    handlePreparedSectionDragLeave: sectionDrop.handlePreparedSectionDragLeave,
    handlePreparedSectionDrop: sectionDrop.handlePreparedSectionDrop,
    
    // 食材区域拖放
    handleIngredientsSectionDragOver: sectionDrop.handleIngredientsSectionDragOver,
    handleIngredientsSectionDragLeave: sectionDrop.handleIngredientsSectionDragLeave,
    handleIngredientsSectionDrop: sectionDrop.handleIngredientsSectionDrop,
    
    // 辅助函数
    clearDragStates: itemDrag.clearDragStates
  }
}

export default useDragDrop
