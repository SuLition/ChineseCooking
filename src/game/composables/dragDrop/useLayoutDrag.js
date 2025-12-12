/**
 * 厨具布局拖拽模块
 * useLayoutDrag
 * 
 * 处理厨具在网格中的位置拖动
 */

import { ref, computed } from 'vue'
import { appliances } from '../../data/appliances'

/**
 * 厨具布局拖拽
 * @param {Object} options 配置选项
 * @param {Ref} options.userApplianceLayout - 厨具布局
 * @param {number} options.GRID_COLS - 网格列数
 * @param {number} options.GRID_ROWS - 网格行数
 */
export function useLayoutDrag(options) {
  const {
    userApplianceLayout,
    GRID_COLS = 10,
    GRID_ROWS = 5
  } = options

  // 拖拽状态
  const draggingAppliance = ref(null)
  const dragPreviewPos = ref(null)
  const gridRef = ref(null)

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

  return {
    // 状态
    draggingAppliance,
    dragPreviewPos,
    gridRef,
    
    // 计算属性
    dragPreviewStyle,
    
    // 方法
    isValidPosition,
    handleApplianceLayoutDragStart,
    handleApplianceLayoutDragEnd,
    handleGridDragOver,
    handleGridDrop
  }
}
