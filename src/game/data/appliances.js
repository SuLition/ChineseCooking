/**
 * 厨具数据
 * Appliances Data
 */

export const appliances = {
  cutting_board: {
    id: 'cutting_board',
    name: '切菜板',
    icon: '🔪',
    image: '/images/appliances/cutting_board.png',
    // 网格占位 (列 x 行)
    gridSize: { cols: 1, rows: 2 },
    // 容量（可同时放入的食材数量）
    capacity: 1,
    // 当前等级
    level: 1,
    // 处理时间（毫秒）
    processTime: 3000,
    // 烧焦倒计时（毫秒，0表示不会烧焦）
    burnTime: 0,
    // 清理时间（毫秒）
    cleanTime: 2000,
    // 购买价格
    price: 0,
    // 描述
    description: '将食材切成合适大小'
  },
  
  wok: {
    id: 'wok',
    name: '炒锅',
    icon: '🍳',
    image: '/images/appliances/wok.png',
    gridSize: { cols: 2, rows: 3 },
    capacity: 6,
    level: 1,
    processTime: 4000,
    burnTime: 5000,  // 完成后5秒会烧焦
    cleanTime: 3000,
    price: 0,
    description: '翻炒食材'
  },
  
  steamer: {
    id: 'steamer',
    name: '蒸箱',
    icon: '♨️',
    image: '/images/appliances/steamer.png',
    gridSize: { cols: 2, rows: 2 },
    capacity: 4,
    level: 1,
    processTime: 6000,
    burnTime: 8000,
    cleanTime: 2000,
    price: 200,
    description: '蒸制食材'
  },
  
  mixer: {
    id: 'mixer',
    name: '搅拌器',
    icon: '🥤',
    image: '/images/appliances/mixer.png',
    gridSize: { cols: 1, rows: 2 },
    capacity: 1,
    level: 1,
    processTime: 3000,
    burnTime: 0,  // 不会烧焦
    cleanTime: 2000,
    price: 150,
    description: '搅拌混合食材'
  },
  
  grill: {
    id: 'grill',
    name: '烤炉',
    icon: '🔥',
    image: '/images/appliances/grill.png',
    gridSize: { cols: 2, rows: 2 },
    capacity: 4,
    level: 1,
    processTime: 8000,
    burnTime: 6000,
    cleanTime: 5000,
    price: 500,
    description: '烤制食材'
  }
}

// 获取厨具列表
export function getApplianceList() {
  return Object.values(appliances)
}

// 根据ID获取厨具
export function getApplianceById(id) {
  return appliances[id] || null
}

// 根据价格获取可购买厨具
export function getPurchasableAppliances() {
  return Object.values(appliances).filter(a => a.price > 0)
}

// 获取厨具的CSS类名
export function getApplianceSizeClass(appliance) {
  return `size-${appliance.gridSize.cols}x${appliance.gridSize.rows}`
}

export default appliances
