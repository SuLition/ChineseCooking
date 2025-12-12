/**
 * 商店商品数据
 * Shop Items Data
 */

// 食材商品分类
export const ingredientCategories = [
  {
    id: 'vegetables',
    name: '蔬菜类',
    icon: '🥬',
    items: [
      { id: 'vegetables', name: '青菜', icon: '🥬', price: 3 },
      { id: 'cabbage', name: '白菜', icon: '🥗', price: 3 },
      { id: 'tomato', name: '番茄', icon: '🍅', price: 4 },
      { id: 'mushroom', name: '香菇', icon: '🍄', price: 5 },
      { id: 'bamboo', name: '竹笋', icon: '🎋', price: 6 },
      { id: 'eggplant', name: '茄子', icon: '🍆', price: 4 }
    ]
  },
  {
    id: 'meat',
    name: '肉类',
    icon: '🥩',
    items: [
      { id: 'pork', name: '猪肉', icon: '🥩', price: 8 },
      { id: 'chicken', name: '鸡肉', icon: '🍗', price: 10 },
      { id: 'beef', name: '牛肉', icon: '🥓', price: 15 },
      { id: 'duck', name: '鸭肉', icon: '🦆', price: 18 }
    ]
  },
  {
    id: 'seafood',
    name: '海鲜类',
    icon: '🦐',
    items: [
      { id: 'fish', name: '鱼', icon: '🐟', price: 12 },
      { id: 'shrimp', name: '虾', icon: '🦐', price: 15 },
      { id: 'crab', name: '螃蟹', icon: '🦀', price: 25 }
    ]
  },
  {
    id: 'staple',
    name: '主食类',
    icon: '🍚',
    items: [
      { id: 'rice', name: '米饭', icon: '🍚', price: 2 },
      { id: 'noodles', name: '面条', icon: '🍜', price: 3 },
      { id: 'flour', name: '面粉', icon: '🌾', price: 2 }
    ]
  },
  {
    id: 'egg_tofu',
    name: '蛋豆类',
    icon: '🥚',
    items: [
      { id: 'egg', name: '鸡蛋', icon: '🥚', price: 2 },
      { id: 'tofu', name: '豆腐', icon: '🧈', price: 3 }
    ]
  },
  {
    id: 'seasoning',
    name: '调料类',
    icon: '🧂',
    items: [
      { id: 'chili', name: '辣椒', icon: '🌶️', price: 2 },
      { id: 'ginger', name: '姜', icon: '🫚', price: 2 },
      { id: 'garlic', name: '大蒜', icon: '🧄', price: 2 },
      { id: 'spring_onion', name: '葱', icon: '🧅', price: 1 },
      { id: 'soy_sauce', name: '酱油', icon: '🫗', price: 3 },
      { id: 'vinegar', name: '醋', icon: '🍶', price: 3 },
      { id: 'sugar', name: '糖', icon: '🧂', price: 2 },
      { id: 'peanut', name: '花生', icon: '🥜', price: 4 }
    ]
  }
]

// 获取所有食材商品（扁平化）
export function getAllIngredientItems() {
  return ingredientCategories.flatMap(cat => cat.items)
}

// 根据ID获取食材商品
export function getIngredientItemById(id) {
  for (const category of ingredientCategories) {
    const item = category.items.find(i => i.id === id)
    if (item) return item
  }
  return null
}

// 购买数量选项
export const buyQuantityOptions = [1, 5, 10]

export default {
  ingredientCategories,
  buyQuantityOptions,
  getAllIngredientItems,
  getIngredientItemById
}
