/**
 * 拖放系统工具函数
 * Drag & Drop Utilities
 * 
 * 统一的拖放数据格式和判断逻辑
 */

import { rawIngredients, preparedIngredients, seasonings } from '../data/ingredients'
import { appliances } from '../data/appliances'

// ========== 拖放数据格式 ==========

/**
 * 创建统一的拖放数据对象
 * @param {Object} options 
 * @returns {Object} 拖放数据
 */
export function createDragData(options) {
  const {
    type,           // 'ingredient' | 'prepared' | 'seasoning' | 'dish'
    id,             // 物品ID
    source,         // 'inventory' | 'prepared_list' | 'appliance'
    sourceApplianceId = null,
    sourceSlotIndex = null,
    count = 1,
    name = '',
    icon = '',
    image = '',
    maxStack = 1
  } = options

  return {
    type,
    id,
    source,
    sourceApplianceId,
    sourceSlotIndex,
    count,
    name,
    icon,
    image,
    maxStack
  }
}

/**
 * 序列化拖放数据为字符串（用于 dataTransfer）
 */
export function serializeDragData(data) {
  return JSON.stringify(data)
}

/**
 * 反序列化拖放数据
 */
export function parseDragData(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

// ========== 目标区域类型 ==========

export const DropTargets = {
  INVENTORY: 'inventory',       // 食材库存区
  PREPARED_LIST: 'prepared',    // 备菜区
  APPLIANCE: 'appliance',       // 厨具
  PLATE: 'plate',               // 盘子
  TRASH: 'trash'                // 垃圾桶（丢弃）
}

// ========== 判断函数 ==========

/**
 * 判断物品是否可以放入指定目标
 * @param {Object} item 拖放数据
 * @param {string} targetType 目标类型
 * @param {Object} targetOptions 目标选项（如厨具ID等）
 * @returns {Object} { canDrop: boolean, reason: string }
 */
export function canDrop(item, targetType, targetOptions = {}) {
  if (!item) return { canDrop: false, reason: '无效物品' }

  switch (targetType) {
    case DropTargets.INVENTORY:
      // 只有生食材可以退回库存
      if (item.type === 'ingredient') {
        return { canDrop: true, reason: '' }
      }
      return { canDrop: false, reason: '只有生食材可以退回库存' }

    case DropTargets.PREPARED_LIST:
      // 成品菜只能装盘，不能放入备菜区
      if (item.type === 'dish') {
        return { canDrop: false, reason: '成品菜只能装盘' }
      }
      // 备菜可以放入备菜区
      if (item.type === 'prepared') {
        return { canDrop: true, reason: '' }
      }
      // 生食材从厨具拖出时也可以放到备菜区（会退回库存）
      if (item.type === 'ingredient' && item.source === 'appliance') {
        return { canDrop: true, reason: '将退回库存' }
      }
      // 调料丢弃
      if (item.type === 'seasoning') {
        return { canDrop: true, reason: '将被丢弃' }
      }
      return { canDrop: false, reason: '无法放入备菜区' }

    case DropTargets.APPLIANCE:
      const { applianceId, applianceStatus } = targetOptions
      const applianceData = appliances[applianceId]
      
      // 垃圾桶特殊处理：接受所有类型的物品
      if (applianceData?.type === 'trash') {
        // 只有空闲或有垃圾状态才能添加
        if (applianceStatus !== 'idle' && applianceStatus !== 'hasIngredients') {
          return { canDrop: false, reason: '垃圾桶正在清理' }
        }
        return { canDrop: true, reason: '' }
      }
      
      // 成品菜只能装盘，不能放入厨具
      if (item.type === 'dish') {
        return { canDrop: false, reason: '成品菜只能装盘' }
      }
      
      // 厨具必须是空闲、有食材或完成状态
      if (applianceStatus !== 'idle' && applianceStatus !== 'hasIngredients' && applianceStatus !== 'done') {
        return { canDrop: false, reason: '厨具正忙' }
      }
      
      // 调料允许放入任何厨具
      if (item.type === 'seasoning') {
        return { canDrop: true, reason: '' }
      }
      
      // 检查 allowedAppliances
      const allowedAppliances = getItemAllowedAppliances(item)
      if (allowedAppliances.length === 0) {
        // 空数组表示允许所有
        return { canDrop: true, reason: '' }
      }
      if (allowedAppliances.includes(applianceId)) {
        return { canDrop: true, reason: '' }
      }
      
      const appName = appliances[applianceId]?.name || applianceId
      return { canDrop: false, reason: `不能放入${appName}` }

    case DropTargets.PLATE:
      // 只有成品菜可以装盘
      if (item.type === 'dish') {
        return { canDrop: true, reason: '' }
      }
      return { canDrop: false, reason: '只有成品菜可以装盘' }

    case DropTargets.TRASH:
      // 任何东西都可以丢弃
      return { canDrop: true, reason: '' }

    default:
      return { canDrop: false, reason: '未知目标' }
  }
}

/**
 * 获取物品允许的厨具列表
 */
export function getItemAllowedAppliances(item) {
  if (!item) return []
  
  if (item.type === 'ingredient') {
    const ingredient = rawIngredients[item.id]
    return ingredient?.allowedAppliances || []
  }
  
  if (item.type === 'prepared') {
    const prepared = preparedIngredients[item.id]
    return prepared?.allowedAppliances || []
  }
  
  if (item.type === 'seasoning') {
    return [] // 调料允许所有
  }
  
  if (item.type === 'dish') {
    return [] // 成品菜一般不再加工，但允许放入（用于特殊菜谱）
  }
  
  return []
}

/**
 * 获取物品的最大堆叠数
 */
export function getItemMaxStack(item) {
  if (!item) return 1
  
  if (item.maxStack) return item.maxStack
  
  if (item.type === 'ingredient') {
    const ingredient = rawIngredients[item.id]
    return ingredient?.maxStack || 1
  }
  
  if (item.type === 'prepared') {
    const prepared = preparedIngredients[item.id]
    return prepared?.maxStack || 1
  }
  
  return 1
}

/**
 * 获取物品的完整数据
 */
export function getItemData(type, id) {
  switch (type) {
    case 'ingredient':
      return rawIngredients[id] || null
    case 'prepared':
      return preparedIngredients[id] || null
    case 'seasoning':
      return seasonings[id] || null
    default:
      return null
  }
}

// ========== 拖拽预览 ==========

/**
 * 预览样式预设
 */
export const PreviewStyles = {
  // 默认方形卡片
  DEFAULT: {
    width: 80,
    height: 80,
    borderRadius: '8px',
    borderColor: '#ffd700',
    shadowColor: 'rgba(255, 215, 0, 0.4)',
    iconSize: 40,
    fontSize: 30
  },
  // 盘子圆形样式
  PLATE: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    borderColor: '#4ade80',
    shadowColor: 'rgba(74, 222, 128, 0.4)',
    iconSize: 50,
    fontSize: 36
  },
  // 厨具布局拖拽（动态尺寸）
  APPLIANCE: {
    borderRadius: '8px',
    borderColor: '#ffd700',
    shadowColor: 'rgba(255, 215, 0, 0.4)'
  }
}

/**
 * 创建拖拽预览元素
 * @param {Object} item - 物品数据 { image, icon, name }
 * @param {Object} options - 可选配置
 * @param {string} options.style - 预设样式 'default' | 'plate' | 'appliance'
 * @param {number} options.width - 自定义宽度
 * @param {number} options.height - 自定义高度
 * @param {string} options.borderColor - 自定义边框颜色
 * @returns {HTMLElement} 预览元素
 */
export function createDragPreview(item, options = {}) {
  const stylePreset = options.style === 'plate' ? PreviewStyles.PLATE 
    : options.style === 'appliance' ? PreviewStyles.APPLIANCE 
    : PreviewStyles.DEFAULT

  const width = options.width || stylePreset.width || 80
  const height = options.height || stylePreset.height || 80
  const borderRadius = options.borderRadius || stylePreset.borderRadius
  const borderColor = options.borderColor || stylePreset.borderColor
  const shadowColor = options.shadowColor || stylePreset.shadowColor
  const iconSize = options.iconSize || stylePreset.iconSize || 40
  const fontSize = options.fontSize || stylePreset.fontSize || 30

  const preview = document.createElement('div')
  preview.style.cssText = `
    position: fixed;
    top: -1000px;
    left: -1000px;
    width: ${width}px;
    height: ${height}px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid ${borderColor};
    border-radius: ${borderRadius};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    box-sizing: border-box;
    box-shadow: 0 4px 15px ${shadowColor};
    z-index: 9999;
    pointer-events: none;
  `

  if (item.image) {
    const img = document.createElement('img')
    img.src = item.image
    img.style.cssText = `width: ${iconSize}px; height: ${iconSize}px; object-fit: contain;`
    preview.appendChild(img)
  } else {
    const icon = document.createElement('span')
    icon.textContent = item.icon || '❓'
    icon.style.cssText = `font-size: ${fontSize}px;`
    preview.appendChild(icon)
  }

  const name = document.createElement('span')
  name.textContent = item.name || '未知'
  name.style.cssText = 'font-size: 10px; color: #fff; text-align: center; margin-top: 4px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
  preview.appendChild(name)

  return preview
}

/**
 * 设置拖拽图像并自动清理
 * @param {DragEvent} e - 拖拽事件
 * @param {Object} item - 物品数据
 * @param {Object} options - 预览配置
 */
export function setDragImage(e, item, options = {}) {
  const preview = createDragPreview(item, options)
  document.body.appendChild(preview)
  
  const width = options.width || (options.style === 'plate' ? 100 : 80)
  const height = options.height || (options.style === 'plate' ? 100 : 80)
  
  e.dataTransfer.setDragImage(preview, width / 2, height / 2)
  setTimeout(() => document.body.removeChild(preview), 0)
}
