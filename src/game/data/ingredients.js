/**
 * 食材数据
 * Ingredients Data
 * 
 * 分为三类：
 * 1. rawIngredients - 生食材（可购买）
 * 2. preparedIngredients - 处理后食材（备菜，通过厨具处理获得）
 * 3. seasonings - 调料（独立系统，有使用量）
 */

// ========== 生食材（可购买） ==========
// allowedAppliances: 允许放入的厨具列表，空数组表示允许所有厨具
// maxStack: 同一槽位最大堆叠数量，默认为1
export const rawIngredients = {
  vegetables: {
    id: 'vegetables',
    name: '生青菜',
    icon: '🥬',
    image: '/images/ingredients/vegetables.png',
    category: 'vegetable',
    price: 5,
    description: '新鲜的青菜',
    allowedAppliances: ['cutting_board'],
    maxStack: 3  // 青菜可以堆叠3个
  },
  tomato: {
    id: 'tomato',
    name: '生番茄',
    icon: '🍅',
    image: '/images/ingredients/tomato.png',
    category: 'vegetable',
    price: 6,
    description: '红彤彤的番茄',
    allowedAppliances: ['cutting_board'],
    maxStack: 2  // 番茄可以堆叠2个
  },
  pumpkin: {
    id: 'pumpkin',
    name: '生南瓜',
    icon: '🎃',
    image: '/images/ingredients/pumpkin.png',
    category: 'vegetable',
    price: 8,
    description: '香甜的南瓜',
    allowedAppliances: ['cutting_board'],
    maxStack: 1  // 南瓜太大只能放1个
  },
  onion: {
    id: 'onion',
    name: '洋葱',
    icon: '🧅',
    image: '/images/ingredients/onion.png',
    category: 'vegetable',
    price: 4,
    description: '辣辣的洋葱',
    allowedAppliances: ['cutting_board'],
    maxStack: 2
  },
  egg: {
    id: 'egg',
    name: '生鸡蛋',
    icon: '🥚',
    image: '/images/ingredients/egg.png',
    category: 'egg',
    price: 3,
    description: '新鲜鸡蛋',
    allowedAppliances: ['mixer', 'wok'],
    maxStack: 3  // 鸡蛋可以堆叠3个
  },
  chicken_leg: {
    id: 'chicken_leg',
    name: '生鸡腿',
    icon: '🍗',
    image: '/images/ingredients/chicken_leg.png',
    category: 'meat',
    price: 15,
    description: '鸡腿肉',
    allowedAppliances: ['cutting_board', 'grill'],
    maxStack: 1  // 鸡腿只能放1个
  },
  garlic: {
    id: 'garlic',
    name: '大蒜',
    icon: '🧄',
    image: '/images/ingredients/garlic.png',
    category: 'seasoning',
    price: 2,
    description: '提味的大蒜',
    allowedAppliances: ['cutting_board'],
    maxStack: 5  // 大蒜小可以堆叠5个
  },
  herbs: {
    id: 'herbs',
    name: '香草',
    icon: '🌿',
    image: '/images/ingredients/herbs.png',
    category: 'seasoning',
    price: 5,
    description: '香料植物',
    allowedAppliances: ['cutting_board'],
    maxStack: 3
  }
}

// ========== 处理后食材（备菜） ==========
// allowedAppliances: 允许放入的厨具列表，空数组表示允许所有厨具
// maxStack: 同一槽位最大堆叠数量，默认为1
export const preparedIngredients = {
  vegetables_chopped: {
    id: 'vegetables_chopped',
    name: '切好的青菜',
    icon: '🥗',
    image: '/images/prepared/vegetables_chopped.png',
    source: 'vegetables',
    appliance: 'cutting_board',
    processTime: 2000,
    description: '切好的新鲜青菜',
    allowedAppliances: ['wok', 'steamer'],
    maxStack: 3
  },
  garlic_chopped: {
    id: 'garlic_chopped',
    name: '蒜末',
    icon: '🧄',
    image: '/images/prepared/garlic_chopped.png',
    source: 'garlic',
    appliance: 'cutting_board',
    processTime: 1500,
    description: '切好的蒜末',
    allowedAppliances: ['wok'],
    maxStack: 5
  },
  tomato_chopped: {
    id: 'tomato_chopped',
    name: '切好的番茄',
    icon: '🍅',
    image: '/images/prepared/tomato_chopped.png',
    source: 'tomato',
    appliance: 'cutting_board',
    processTime: 2000,
    description: '切好的番茄块',
    allowedAppliances: ['wok'],
    maxStack: 2
  },
  tomato_fried: {
    id: 'tomato_fried',
    name: '炒好的番茄',
    icon: '🍅',
    image: '/images/prepared/tomato_fried.png',
    source: 'tomato_chopped',
    appliance: 'wok',
    processTime: 2500,
    description: '炒好的番茄',
    allowedAppliances: ['wok'],
    maxStack: 2
  },
  egg_beaten: {
    id: 'egg_beaten',
    name: '打散的鸡蛋',
    icon: '🥚',
    image: '/images/prepared/egg_beaten.png',
    source: 'egg',
    appliance: 'mixer',
    processTime: 1500,
    description: '打散的鸡蛋液',
    allowedAppliances: ['wok', 'steamer'],
    maxStack: 3
  },
  egg_fried: {
    id: 'egg_fried',
    name: '炒好的鸡蛋',
    icon: '🍳',
    image: '/images/prepared/egg_fried.png',
    source: 'egg',
    appliance: 'wok',
    processTime: 2500,
    description: '炒好的鸡蛋',
    allowedAppliances: ['wok'],
    maxStack: 2
  },
  chicken_leg_chopped: {
    id: 'chicken_leg_chopped',
    name: '切好的鸡腿',
    icon: '🍗',
    image: '/images/prepared/chicken_leg_chopped.png',
    source: 'chicken_leg',
    appliance: 'cutting_board',
    processTime: 3000,
    description: '切好的鸡腿块',
    allowedAppliances: ['wok', 'grill', 'steamer'],
    maxStack: 2
  },
  pumpkin_chopped: {
    id: 'pumpkin_chopped',
    name: '南瓜块',
    icon: '🎃',
    image: '/images/prepared/pumpkin_chopped.png',
    source: 'pumpkin',
    appliance: 'cutting_board',
    processTime: 3000,
    description: '切好的南瓜块',
    allowedAppliances: ['wok', 'steamer'],
    maxStack: 1
  },
  onion_chopped: {
    id: 'onion_chopped',
    name: '洋葱丁',
    icon: '🧅',
    image: '/images/prepared/onion_chopped.png',
    source: 'onion',
    appliance: 'cutting_board',
    processTime: 2000,
    description: '切好的洋葱丁',
    allowedAppliances: ['wok', 'grill'],
    maxStack: 2
  },
  herbs_chopped: {
    id: 'herbs_chopped',
    name: '切好的香草',
    icon: '🌿',
    image: '/images/prepared/herbs_chopped.png',
    source: 'herbs',
    appliance: 'cutting_board',
    processTime: 1500,
    description: '切好的香草末',
    allowedAppliances: [],
    maxStack: 3
  }
}

// ========== 调料 ==========
export const seasonings = {
  salt: {
    id: 'salt',
    name: '盐',
    icon: '🧂',
    image: '/images/seasonings/salt.png',
    maxAmount: 100,
    maxStack: 3,  // 调料也可以堆叠
    description: '基础调味料'
  },
  sugar: {
    id: 'sugar',
    name: '糖',
    icon: '🍬',
    image: '/images/seasonings/sugar.png',
    maxAmount: 100,
    maxStack: 3,
    description: '增添甜味'
  }
}

// ========== 工具函数 ==========

// 获取生食材列表
export function getRawIngredientList() {
  return Object.values(rawIngredients)
}

// 根据分类获取生食材
export function getRawIngredientsByCategory(category) {
  return Object.values(rawIngredients).filter(ing => ing.category === category)
}

// 根据ID获取生食材
export function getRawIngredientById(id) {
  return rawIngredients[id] || null
}

// 获取处理后食材列表
export function getPreparedIngredientList() {
  return Object.values(preparedIngredients)
}

// 根据ID获取处理后食材
export function getPreparedIngredientById(id) {
  return preparedIngredients[id] || null
}

// 根据厨具获取可产出的备菜
export function getPreparedByAppliance(applianceId) {
  return Object.values(preparedIngredients).filter(p => p.appliance === applianceId)
}

// 根据源食材获取可产出的备菜
export function getPreparedBySource(sourceId) {
  return Object.values(preparedIngredients).filter(p => p.source === sourceId)
}

// 获取调料列表
export function getSeasoningList() {
  return Object.values(seasonings)
}

// 根据ID获取调料
export function getSeasoningById(id) {
  return seasonings[id] || null
}

// 兼容旧代码 - 合并所有食材
export const ingredients = { ...rawIngredients }

export function getIngredientList() {
  return Object.values(rawIngredients)
}

export function getIngredientById(id) {
  return rawIngredients[id] || preparedIngredients[id] || null
}

export default rawIngredients
