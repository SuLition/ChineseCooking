/**
 * 菜品数据
 * Dishes Data
 * 
 * 新版配方结构：
 * recipe: [
 *   { type: 'prepared', id: '备菜ID', count: 数量 },
 *   { type: 'seasoning', id: '调料ID', count: 数量 },
 *   { type: 'ingredient', id: '生食材ID', count: 数量 }
 * ]
 * appliance: '厨具ID' - 需要使用哪个厨具
 */

// 菜系分类
export const cuisineTypes = {
  // 暂无菜系
}

// 菜品数据
export const dishes = {
  garlic_vegetables: {
    id: 'garlic_vegetables',
    name: '蒜蓉青菜',
    icon: '🥗',
    image: '/images/dishes/garlic_vegetables.png',
    price: 15,
    cookTime: 3000,
    difficulty: 1,
    unlockLevel: 1,
    description: '简单美味的家常菜',
    // 制作所需厨具
    appliance: 'wok',
    // 配方：切好的青菜 + 蒜末 + 盐
    recipe: [
      { type: 'prepared', id: 'vegetables_chopped', count: 1 },
      { type: 'prepared', id: 'garlic_chopped', count: 1 },
      { type: 'seasoning', id: 'salt', count: 1 }
    ]
  },
  tomato_egg: {
    id: 'tomato_egg',
    name: '番茄炒蛋',
    icon: '🍳',
    image: '/images/dishes/tomato_egg.png',
    price: 18,
    cookTime: 3000,
    difficulty: 1,
    unlockLevel: 1,
    description: '经典家常菜，酸甜可口',
    appliance: 'wok',
    // 配方：炒好的番茄 + 炒好的鸡蛋 + 盐
    recipe: [
      { type: 'prepared', id: 'tomato_fried', count: 1 },
      { type: 'prepared', id: 'egg_fried', count: 1 },
      { type: 'seasoning', id: 'salt', count: 1 }
    ]
  }
}

// ========== 工具函数 ==========

// 获取菜品列表
export function getDishList() {
  return Object.values(dishes)
}

// 根据等级获取可用菜品
export function getAvailableDishesByLevel(level) {
  return Object.values(dishes).filter(dish => dish.unlockLevel <= level)
}

// 根据菜系获取菜品
export function getDishesByCuisine(cuisineId) {
  return Object.values(dishes).filter(dish => dish.cuisine === cuisineId)
}

// 根据ID获取菜品
export function getDishById(id) {
  return dishes[id] || null
}

// 获取菜品配方的处理后食材数量
export function getPreparedCount(dish) {
  return dish.recipe.filter(r => r.type === 'prepared').reduce((sum, r) => sum + r.count, 0)
}

// 获取菜品配方的调料数量
export function getSeasoningCount(dish) {
  return dish.recipe.filter(r => r.type === 'seasoning').reduce((sum, r) => sum + r.count, 0)
}

// 获取菜品配方所需的所有材料(带详细信息)
export function getRecipeWithDetails(dish, ingredientData, seasoningData, preparedData) {
  return dish.recipe.map(item => {
    let info = null
    if (item.type === 'prepared') {
      info = preparedData[item.id]
    } else if (item.type === 'seasoning') {
      info = seasoningData[item.id]
    } else if (item.type === 'raw') {
      info = ingredientData[item.id]
    }
    return {
      ...item,
      name: info?.name || item.id,
      icon: info?.icon || '❓'
    }
  })
}

// 检查厨具中的食材是否匹配菜品配方
export function checkRecipeMatch(ingredients, dish, applianceId = null) {
  // 检查厨具是否匹配
  if (dish.appliance && applianceId && dish.appliance !== applianceId) {
    return false
  }
  
  // ingredients: [{ type, id }, ...] - 每个元素代表一个食材
  // 统计配方需要的
  const required = {}
  dish.recipe.forEach(r => {
    const key = `${r.type}_${r.id}`
    required[key] = (required[key] || 0) + r.count
  })
  
  // 统计厨具里有的（每个元素计数为1）
  const have = {}
  ingredients.forEach(item => {
    const key = `${item.type}_${item.id}`
    have[key] = (have[key] || 0) + 1
  })
  
  // 检查是否完全匹配
  const requiredKeys = Object.keys(required)
  const haveKeys = Object.keys(have)
  
  if (requiredKeys.length !== haveKeys.length) return false
  
  return requiredKeys.every(key => have[key] === required[key])
}

// 寻找匹配的菜品
export function findMatchingDish(ingredients, applianceId = null) {
  if (!ingredients || ingredients.length === 0) return null
  
  for (const dish of Object.values(dishes)) {
    const isMatch = checkRecipeMatch(ingredients, dish, applianceId)
    if (isMatch) {
      return dish
    }
  }
  
  return null
}

/**
 * 计算可以产出多少份菜品
 * 基于「最少原料」原则：以数量最少的必需食材为准
 * 
 * @param {Array} ingredients - 厨具中的食材 [{type, id, count}, ...]
 * @param {Object} dish - 菜品数据
 * @param {string} applianceId - 厨具ID
 * @returns {Object} { match: boolean, count: number, dish: Object }
 */
export function calculateDishOutput(ingredients, dish, applianceId = null) {
  // 检查厨具是否匹配
  if (dish.appliance && applianceId && dish.appliance !== applianceId) {
    return { match: false, count: 0, dish: null }
  }
  
  // 统计配方需要的每种食材数量（单份）
  const required = {}
  dish.recipe.forEach(r => {
    const key = `${r.type}_${r.id}`
    required[key] = (required[key] || 0) + r.count
  })
  
  // 统计厨具里有的每种食材数量（考虑堆叠）
  const have = {}
  ingredients.forEach(item => {
    const key = `${item.type}_${item.id}`
    have[key] = (have[key] || 0) + (item.count || 1)
  })
  
  // 检查是否有所有需要的食材类型，并计算每种食材能做几份
  const requiredKeys = Object.keys(required)
  let maxOutputCount = Infinity
  
  for (const key of requiredKeys) {
    const needPerDish = required[key]
    const haveAmount = have[key] || 0
    
    // 如果某种食材不足以做一份，则不匹配
    if (haveAmount < needPerDish) {
      return { match: false, count: 0, dish: null }
    }
    
    // 计算这种食材能做几份
    const possibleCount = Math.floor(haveAmount / needPerDish)
    maxOutputCount = Math.min(maxOutputCount, possibleCount)
  }
  
  if (maxOutputCount === Infinity || maxOutputCount <= 0) {
    return { match: false, count: 0, dish: null }
  }
  
  return { match: true, count: maxOutputCount, dish }
}

/**
 * 寻找匹配的菜品并计算产出数量
 * 
 * @param {Array} ingredients - 厨具中的食材
 * @param {string} applianceId - 厨具ID
 * @returns {Object|null} { match: boolean, count: number, dish: Object } 或 null
 */
export function findMatchingDishWithCount(ingredients, applianceId = null) {
  if (!ingredients || ingredients.length === 0) return null
  
  for (const dish of Object.values(dishes)) {
    const result = calculateDishOutput(ingredients, dish, applianceId)
    if (result.match) {
      return result
    }
  }
  
  return null
}

// 计算菜品建议耐心值
export function getSuggestedPatience(dish) {
  const recipeCount = dish.recipe.length
  const difficulty = dish.difficulty || 2
  return 80 + recipeCount * 40 + dish.price * 20 + difficulty * 20
}

export default dishes
