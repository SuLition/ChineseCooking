/**
 * 菜品执行步骤配置
 * 
 * 每道菜定义清晰的执行步骤，自动做菜系统按顺序执行
 * 
 * 步骤类型：
 * - prepare: 制作备菜（原材料→厨具→备菜）
 * - cook: 最终烹饪（备菜+调料→厨具→成品）
 */

export const recipeSteps = {
  // ========== 蒜蓉青菜 ==========
  garlic_vegetables: {
    name: '蒜蓉青菜',
    steps: [
      {
        type: 'prepare',
        desc: '切青菜',
        input: { type: 'ingredient', id: 'vegetables' },
        appliance: 'cutting_board',
        output: 'vegetables_chopped'
      },
      {
        type: 'prepare',
        desc: '切蒜末',
        input: { type: 'ingredient', id: 'garlic' },
        appliance: 'cutting_board',
        output: 'garlic_chopped'
      },
      {
        type: 'cook',
        desc: '炒蒜蓉青菜',
        inputs: [
          { type: 'prepared', id: 'vegetables_chopped' },
          { type: 'prepared', id: 'garlic_chopped' },
          { type: 'seasoning', id: 'salt', count: 1 }
        ],
        appliance: 'wok',
        output: 'garlic_vegetables'
      }
    ]
  },

  // ========== 番茄炒蛋 ==========
  tomato_egg: {
    name: '番茄炒蛋',
    steps: [
      {
        type: 'prepare',
        desc: '切番茄',
        input: { type: 'ingredient', id: 'tomato' },
        appliance: 'cutting_board',
        output: 'tomato_chopped'
      },
      {
        type: 'prepare',
        desc: '炒番茄',
        input: { type: 'prepared', id: 'tomato_chopped' },
        appliance: 'wok',
        output: 'tomato_fried'
      },
      {
        type: 'prepare',
        desc: '炒鸡蛋',
        input: { type: 'ingredient', id: 'egg' },
        appliance: 'wok',
        output: 'egg_fried'
      },
      {
        type: 'cook',
        desc: '合炒番茄炒蛋',
        inputs: [
          { type: 'prepared', id: 'tomato_fried' },
          { type: 'prepared', id: 'egg_fried' },
          { type: 'seasoning', id: 'salt', count: 1 }
        ],
        appliance: 'wok',
        output: 'tomato_egg'
      }
    ]
  },

  // ========== 素什锦 ==========
  mixed_vegetables: {
    name: '素什锦',
    steps: [
      {
        type: 'prepare',
        desc: '切青菜',
        input: { type: 'ingredient', id: 'vegetables' },
        appliance: 'cutting_board',
        output: 'vegetables_chopped'
      },
      {
        type: 'prepare',
        desc: '切洋葱',
        input: { type: 'ingredient', id: 'onion' },
        appliance: 'cutting_board',
        output: 'onion_chopped'
      },
      {
        type: 'prepare',
        desc: '切蒜末',
        input: { type: 'ingredient', id: 'garlic' },
        appliance: 'cutting_board',
        output: 'garlic_chopped'
      },
      {
        type: 'cook',
        desc: '炒素什锦',
        inputs: [
          { type: 'prepared', id: 'vegetables_chopped' },
          { type: 'prepared', id: 'onion_chopped' },
          { type: 'prepared', id: 'garlic_chopped' },
          { type: 'seasoning', id: 'salt', count: 1 }
        ],
        appliance: 'wok',
        output: 'mixed_vegetables'
      }
    ]
  },

  // ========== 蒸南瓜 ==========
  steamed_pumpkin: {
    name: '蒸南瓜',
    steps: [
      {
        type: 'prepare',
        desc: '切南瓜',
        input: { type: 'ingredient', id: 'pumpkin' },
        appliance: 'cutting_board',
        output: 'pumpkin_chopped'
      },
      {
        type: 'cook',
        desc: '蒸南瓜',
        inputs: [
          { type: 'prepared', id: 'pumpkin_chopped' },
          { type: 'seasoning', id: 'sugar', count: 1 }
        ],
        appliance: 'steamer',
        output: 'steamed_pumpkin'
      }
    ]
  },

  // ========== 蒸蛋 ==========
  steamed_egg: {
    name: '蒸蛋',
    steps: [
      {
        type: 'prepare',
        desc: '打散鸡蛋',
        input: { type: 'ingredient', id: 'egg' },
        appliance: 'mixer',
        output: 'egg_beaten'
      },
      {
        type: 'cook',
        desc: '蒸蛋',
        inputs: [
          { type: 'prepared', id: 'egg_beaten' },
          { type: 'seasoning', id: 'salt', count: 1 }
        ],
        appliance: 'steamer',
        output: 'steamed_egg'
      }
    ]
  },

  // ========== 清蒸时蔬 ==========
  steamed_vegetables: {
    name: '清蒸时蔬',
    steps: [
      {
        type: 'prepare',
        desc: '切青菜',
        input: { type: 'ingredient', id: 'vegetables' },
        appliance: 'cutting_board',
        output: 'vegetables_chopped'
      },
      {
        type: 'prepare',
        desc: '切南瓜',
        input: { type: 'ingredient', id: 'pumpkin' },
        appliance: 'cutting_board',
        output: 'pumpkin_chopped'
      },
      {
        type: 'prepare',
        desc: '切香草',
        input: { type: 'ingredient', id: 'herbs' },
        appliance: 'cutting_board',
        output: 'herbs_chopped'
      },
      {
        type: 'cook',
        desc: '清蒸时蔬',
        inputs: [
          { type: 'prepared', id: 'vegetables_chopped' },
          { type: 'prepared', id: 'pumpkin_chopped' },
          { type: 'prepared', id: 'herbs_chopped' },
          { type: 'seasoning', id: 'salt', count: 1 }
        ],
        appliance: 'steamer',
        output: 'steamed_vegetables'
      }
    ]
  }
}

/**
 * 获取菜品的执行步骤
 * @param {string} dishId 菜品ID
 * @returns {Array|null} 执行步骤数组
 */
export function getRecipeSteps(dishId) {
  return recipeSteps[dishId]?.steps || null
}

/**
 * 检查菜品是否有预定义步骤
 * @param {string} dishId 菜品ID
 * @returns {boolean}
 */
export function hasRecipeSteps(dishId) {
  return !!recipeSteps[dishId]
}

export default recipeSteps
