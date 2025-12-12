/**
 * 厨具网格布局组合式函数
 * useApplianceGrid Composable
 * 
 * 管理厨具网格布局计算逻辑
 */

import { computed } from 'vue'
import { GRID } from '../constants'

const { COLS: GRID_COLS, ROWS: GRID_ROWS } = GRID

/**
 * 创建厨具网格布局系统
 * @param {Object} options 配置选项
 * @param {import('vue').Ref} options.userApplianceLayout - 用户厨具布局
 */
export function useApplianceGrid(options) {
  const { userApplianceLayout } = options

  // ========== 计算属性 ==========

  /**
   * 计算被占用的格子位置
   */
  const occupiedCells = computed(() => {
    const occupied = new Set()
    userApplianceLayout.value.forEach(app => {
      for (let r = app.row; r < app.row + app.height; r++) {
        for (let c = app.col; c < app.col + app.width; c++) {
          occupied.add(`${r}-${c}`)
        }
      }
    })
    return occupied
  })

  /**
   * 生成空的格子列表
   */
  const emptySlots = computed(() => {
    const slots = []
    for (let row = 1; row <= GRID_ROWS; row++) {
      for (let col = 1; col <= GRID_COLS; col++) {
        if (!occupiedCells.value.has(`${row}-${col}`)) {
          slots.push({ row, col, key: `slot-${row}-${col}` })
        }
      }
    }
    return slots
  })

  // ========== 辅助函数 ==========

  /**
   * 获取厨具的 grid-area 样式
   * @param {Object} app - 厨具布局对象 { row, col, width, height }
   */
  function getApplianceGridStyle(app) {
    return {
      gridArea: `${app.row} / ${app.col} / ${app.row + app.height} / ${app.col + app.width}`
    }
  }

  /**
   * 检查位置是否被占用
   * @param {number} row - 行号
   * @param {number} col - 列号
   */
  function isCellOccupied(row, col) {
    return occupiedCells.value.has(`${row}-${col}`)
  }

  /**
   * 检查区域是否可放置厨具
   * @param {number} row - 起始行
   * @param {number} col - 起始列
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {string} excludeId - 排除的厨具ID（用于拖拽时）
   */
  function canPlaceAppliance(row, col, width, height, excludeId = null) {
    // 检查边界
    if (row < 1 || col < 1 || row + height - 1 > GRID_ROWS || col + width - 1 > GRID_COLS) {
      return false
    }
    
    // 检查占用（排除自身）
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        const cellKey = `${r}-${c}`
        if (occupiedCells.value.has(cellKey)) {
          // 检查是否是自身占用
          const occupier = userApplianceLayout.value.find(app => {
            if (app.id === excludeId) return false
            return r >= app.row && r < app.row + app.height &&
                   c >= app.col && c < app.col + app.width
          })
          if (occupier) return false
        }
      }
    }
    
    return true
  }

  // ========== 返回接口 ==========

  return {
    // 常量
    GRID_COLS,
    GRID_ROWS,
    
    // 计算属性
    occupiedCells,
    emptySlots,
    
    // 方法
    getApplianceGridStyle,
    isCellOccupied,
    canPlaceAppliance
  }
}

export default useApplianceGrid
