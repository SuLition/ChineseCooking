/**
 * 菜谱测试工具
 * Recipe Test Tools
 * 
 * 用于在控制台快速测试和验证菜谱配方
 * 使用方法: 在浏览器控制台输入 window.testRecipe('dish_id')
 */

import { rawIngredients, preparedIngredients, seasonings } from '../data/ingredients'
import { dishes } from '../data/dishes'
import { appliances } from '../data/appliances'

// ========== 样式常量 ==========
const STYLES = {
  title: 'color: #FFD700; font-size: 14px; font-weight: bold;',
  success: 'color: #4ADE80; font-weight: bold;',
  error: 'color: #EF4444; font-weight: bold;',
  warning: 'color: #F59E0B; font-weight: bold;',
  info: 'color: #60A5FA;',
  dim: 'color: #888;',
  reset: ''
}

// ========== 辅助函数 ==========

/**
 * 根据 ID 获取任意类型的食材
 */
function getIngredientById(id) {
  return rawIngredients[id] || preparedIngredients[id] || seasonings[id] || null
}

/**
 * 获取食材类型
 */
function getIngredientType(id) {
  if (rawIngredients[id]) return 'raw'
  if (preparedIngredients[id]) return 'prepared'
  if (seasonings[id]) return 'seasoning'
  return null
}

/**
 * 追溯备菜的完整来源链
 * @param {string} preparedId - 备菜 ID
 * @param {Set} visited - 已访问的 ID（用于循环检测）
 * @returns {Object} { chain: Array, error: string|null }
 */
function traceSourceChain(preparedId, visited = new Set()) {
  const chain = []
  
  // 循环检测
  if (visited.has(preparedId)) {
    return { chain: [], error: `循环依赖检测: ${preparedId}` }
  }
  visited.add(preparedId)
  
  const prepared = preparedIngredients[preparedId]
  if (!prepared) {
    return { chain: [], error: `备菜不存在: ${preparedId}` }
  }
  
  // 当前步骤
  const currentStep = {
    id: preparedId,
    name: prepared.name,
    appliance: prepared.appliance,
    applianceName: appliances[prepared.appliance]?.name || prepared.appliance,
    source: prepared.source,
    processTime: prepared.processTime
  }
  
  // 检查来源
  const sourceType = getIngredientType(prepared.source)
  
  if (sourceType === 'raw') {
    // 来源是生食材，到达终点
    const raw = rawIngredients[prepared.source]
    chain.push({
      from: { id: prepared.source, name: raw.name, type: 'raw' },
      to: { id: preparedId, name: prepared.name, type: 'prepared' },
      appliance: prepared.appliance,
      applianceName: currentStep.applianceName,
      processTime: prepared.processTime
    })
  } else if (sourceType === 'prepared') {
    // 来源是另一个备菜，递归追溯
    const subResult = traceSourceChain(prepared.source, visited)
    if (subResult.error) {
      return subResult
    }
    chain.push(...subResult.chain)
    
    const sourcePrepared = preparedIngredients[prepared.source]
    chain.push({
      from: { id: prepared.source, name: sourcePrepared.name, type: 'prepared' },
      to: { id: preparedId, name: prepared.name, type: 'prepared' },
      appliance: prepared.appliance,
      applianceName: currentStep.applianceName,
      processTime: prepared.processTime
    })
  } else {
    return { chain: [], error: `无效的来源: ${prepared.source}` }
  }
  
  return { chain, error: null }
}

/**
 * 验证厨具链是否合法
 */
function validateApplianceChain(chain) {
  const errors = []
  
  for (const step of chain) {
    const fromItem = getIngredientById(step.from.id)
    const appliance = step.appliance
    
    if (fromItem && fromItem.allowedAppliances && fromItem.allowedAppliances.length > 0) {
      if (!fromItem.allowedAppliances.includes(appliance)) {
        errors.push({
          step: `${step.from.name} → ${step.to.name}`,
          error: `${step.from.name} 不能放入 ${step.applianceName}，允许的厨具: ${fromItem.allowedAppliances.join(', ')}`
        })
      }
    }
  }
  
  return errors
}

// ========== 主要 API ==========

/**
 * 测试单个菜品配方
 */
export function testRecipe(dishId) {
  console.log('\n')
  
  const dish = dishes[dishId]
  if (!dish) {
    console.log('%c❌ 错误: 菜品不存在 - ' + dishId, STYLES.error)
    console.log('%c可用菜品:', STYLES.info, Object.keys(dishes).join(', '))
    return false
  }
  
  // 标题
  console.log('%c╔══════════════════════════════════════════════════════════╗', STYLES.title)
  console.log('%c║  🧪 菜谱测试: ' + dish.name + ' (' + dishId + ')', STYLES.title)
  console.log('%c╠══════════════════════════════════════════════════════════╣', STYLES.title)
  
  let hasError = false
  const allChains = []
  const usedAppliances = new Set()
  let totalTime = 0
  
  // 1. 验证厨具
  const applianceData = appliances[dish.appliance]
  if (!applianceData) {
    console.log('%c║  ❌ 厨具不存在: ' + dish.appliance, STYLES.error)
    hasError = true
  } else {
    console.log('%c║  ✅ 厨具: ' + applianceData.name + ' (' + dish.appliance + ')', STYLES.success)
    usedAppliances.add(dish.appliance)
  }
  
  // 2. 验证配方
  console.log('%c╠══════════════════════════════════════════════════════════╣', STYLES.title)
  console.log('%c║  📋 配方验证:', STYLES.info)
  
  for (const item of dish.recipe) {
    const ingredient = getIngredientById(item.id)
    const typeLabel = item.type === 'prepared' ? '备菜' : item.type === 'seasoning' ? '调料' : '食材'
    
    if (!ingredient) {
      console.log('%c║    ❌ ' + typeLabel + '不存在: ' + item.id, STYLES.error)
      hasError = true
    } else {
      console.log('%c║    ✅ ' + ingredient.name + ' x' + item.count + ' (' + item.id + ')', STYLES.success)
      
      // 如果是备菜，追溯来源
      if (item.type === 'prepared') {
        const traceResult = traceSourceChain(item.id)
        if (traceResult.error) {
          console.log('%c║       ❌ ' + traceResult.error, STYLES.error)
          hasError = true
        } else {
          allChains.push({ preparedId: item.id, chain: traceResult.chain })
          traceResult.chain.forEach(step => {
            usedAppliances.add(step.appliance)
            totalTime += step.processTime
          })
        }
        
        // 验证备菜是否能放入最终厨具
        if (ingredient.allowedAppliances && ingredient.allowedAppliances.length > 0) {
          if (!ingredient.allowedAppliances.includes(dish.appliance)) {
            console.log('%c║       ⚠️ ' + ingredient.name + ' 可能无法放入 ' + applianceData?.name, STYLES.warning)
          }
        }
      }
    }
  }
  
  // 3. 验证厨具链
  console.log('%c╠══════════════════════════════════════════════════════════╣', STYLES.title)
  console.log('%c║  🔗 厨具链验证:', STYLES.info)
  
  let chainErrors = []
  for (const { chain } of allChains) {
    const errors = validateApplianceChain(chain)
    chainErrors.push(...errors)
  }
  
  if (chainErrors.length === 0) {
    console.log('%c║    ✅ 所有厨具链验证通过', STYLES.success)
  } else {
    chainErrors.forEach(err => {
      console.log('%c║    ❌ ' + err.step + ': ' + err.error, STYLES.error)
    })
    hasError = true
  }
  
  // 4. 生成制作流程
  console.log('%c╠══════════════════════════════════════════════════════════╣', STYLES.title)
  console.log('%c║  🔄 制作流程:', STYLES.info)
  
  let stepNum = 1
  const allSteps = []
  
  // 收集所有步骤
  for (const { chain } of allChains) {
    for (const step of chain) {
      // 避免重复步骤
      const stepKey = `${step.from.id}->${step.to.id}`
      if (!allSteps.find(s => `${s.from.id}->${s.to.id}` === stepKey)) {
        allSteps.push(step)
      }
    }
  }
  
  // 输出步骤
  for (const step of allSteps) {
    console.log('%c║    ' + stepNum + '. ' + step.from.name + ' → [' + step.applianceName + '] → ' + step.to.name, STYLES.dim)
    stepNum++
  }
  
  // 最终组合步骤
  const recipeItems = dish.recipe.map(r => {
    const ing = getIngredientById(r.id)
    return ing ? ing.name : r.id
  }).join(' + ')
  console.log('%c║    ' + stepNum + '. ' + recipeItems + ' → [' + (applianceData?.name || dish.appliance) + '] → ' + dish.name, STYLES.info)
  totalTime += dish.cookTime || 3000
  
  // 5. 统计
  console.log('%c╠══════════════════════════════════════════════════════════╣', STYLES.title)
  console.log('%c║  📊 统计:', STYLES.info)
  console.log('%c║    步骤数: ' + stepNum + ' | 厨具: ' + Array.from(usedAppliances).map(a => appliances[a]?.name || a).join(', '), STYLES.dim)
  console.log('%c║    预计时间: ~' + (totalTime / 1000).toFixed(1) + '秒 | 售价: ' + dish.price + '金币', STYLES.dim)
  
  // 结果
  console.log('%c╠══════════════════════════════════════════════════════════╣', STYLES.title)
  if (hasError) {
    console.log('%c║  ❌ 测试结果: 失败', STYLES.error)
  } else {
    console.log('%c║  ✅ 测试结果: 通过', STYLES.success)
  }
  console.log('%c╚══════════════════════════════════════════════════════════╝', STYLES.title)
  
  return !hasError
}

/**
 * 测试所有菜品
 */
export function testAllRecipes() {
  console.log('\n')
  console.log('%c🧪 批量测试所有菜品配方', STYLES.title)
  console.log('%c' + '='.repeat(50), STYLES.dim)
  
  const results = { passed: [], failed: [] }
  
  for (const dishId of Object.keys(dishes)) {
    const passed = testRecipe(dishId)
    if (passed) {
      results.passed.push(dishId)
    } else {
      results.failed.push(dishId)
    }
  }
  
  console.log('\n')
  console.log('%c📊 批量测试结果', STYLES.title)
  console.log('%c' + '='.repeat(50), STYLES.dim)
  console.log('%c✅ 通过: ' + results.passed.length + ' 个', STYLES.success)
  console.log('%c❌ 失败: ' + results.failed.length + ' 个', STYLES.error)
  
  if (results.failed.length > 0) {
    console.log('%c失败的菜品: ' + results.failed.join(', '), STYLES.error)
  }
  
  return results
}

/**
 * 追溯食材来源链
 */
export function traceIngredient(ingredientId) {
  console.log('\n')
  
  const type = getIngredientType(ingredientId)
  const ingredient = getIngredientById(ingredientId)
  
  if (!ingredient) {
    console.log('%c❌ 食材不存在: ' + ingredientId, STYLES.error)
    return null
  }
  
  console.log('%c🔍 追溯食材: ' + ingredient.name + ' (' + ingredientId + ')', STYLES.title)
  console.log('%c类型: ' + type, STYLES.info)
  
  if (type === 'raw') {
    console.log('%c这是生食材，无需追溯', STYLES.dim)
    console.log('%c可用厨具: ' + (ingredient.allowedAppliances?.join(', ') || '所有'), STYLES.info)
    return { type: 'raw', ingredient }
  }
  
  if (type === 'seasoning') {
    console.log('%c这是调料，无需追溯', STYLES.dim)
    return { type: 'seasoning', ingredient }
  }
  
  // 备菜，追溯来源
  const result = traceSourceChain(ingredientId)
  
  if (result.error) {
    console.log('%c❌ ' + result.error, STYLES.error)
    return null
  }
  
  console.log('%c📋 来源链:', STYLES.info)
  result.chain.forEach((step, index) => {
    console.log('%c  ' + (index + 1) + '. ' + step.from.name + ' → [' + step.applianceName + '] → ' + step.to.name, STYLES.dim)
  })
  
  return result
}

/**
 * 验证新配方
 */
export function validateRecipe(config) {
  console.log('\n')
  console.log('%c🧪 验证新配方: ' + (config.name || '未命名'), STYLES.title)
  console.log('%c' + '='.repeat(50), STYLES.dim)
  
  const errors = []
  
  // 验证厨具
  if (!config.appliance) {
    errors.push('缺少 appliance 字段')
  } else if (!appliances[config.appliance]) {
    errors.push('厨具不存在: ' + config.appliance)
  } else {
    console.log('%c✅ 厨具: ' + appliances[config.appliance].name, STYLES.success)
  }
  
  // 验证配方
  if (!config.recipe || !Array.isArray(config.recipe)) {
    errors.push('缺少 recipe 数组')
  } else {
    console.log('%c📋 配方检查:', STYLES.info)
    
    for (const item of config.recipe) {
      if (!item.type || !item.id) {
        errors.push('配方项缺少 type 或 id')
        continue
      }
      
      const ingredient = getIngredientById(item.id)
      if (!ingredient) {
        console.log('%c  ❌ 不存在: ' + item.id + ' (type: ' + item.type + ')', STYLES.error)
        errors.push('食材不存在: ' + item.id)
      } else {
        console.log('%c  ✅ ' + ingredient.name + ' x' + (item.count || 1), STYLES.success)
        
        // 检查能否放入指定厨具
        if (item.type === 'prepared' && ingredient.allowedAppliances?.length > 0) {
          if (!ingredient.allowedAppliances.includes(config.appliance)) {
            console.log('%c     ⚠️ 无法放入 ' + appliances[config.appliance]?.name, STYLES.warning)
          }
        }
      }
    }
  }
  
  // 结果
  console.log('%c' + '='.repeat(50), STYLES.dim)
  if (errors.length === 0) {
    console.log('%c✅ 配方验证通过！', STYLES.success)
    return true
  } else {
    console.log('%c❌ 发现 ' + errors.length + ' 个错误:', STYLES.error)
    errors.forEach(e => console.log('%c  • ' + e, STYLES.error))
    return false
  }
}

/**
 * 列出所有可用材料
 */
export function listIngredients() {
  console.log('\n')
  console.log('%c📦 所有可用材料', STYLES.title)
  
  console.log('%c\n🥬 生食材 (' + Object.keys(rawIngredients).length + '个):', STYLES.info)
  Object.values(rawIngredients).forEach(ing => {
    console.log('%c  ' + ing.icon + ' ' + ing.name + ' (' + ing.id + ') - 厨具: ' + (ing.allowedAppliances?.join(', ') || '所有'), STYLES.dim)
  })
  
  console.log('%c\n🍳 备菜 (' + Object.keys(preparedIngredients).length + '个):', STYLES.info)
  Object.values(preparedIngredients).forEach(ing => {
    console.log('%c  ' + ing.icon + ' ' + ing.name + ' (' + ing.id + ') ← ' + ing.source + ' [' + ing.appliance + ']', STYLES.dim)
  })
  
  console.log('%c\n🧂 调料 (' + Object.keys(seasonings).length + '个):', STYLES.info)
  Object.values(seasonings).forEach(ing => {
    console.log('%c  ' + ing.icon + ' ' + ing.name + ' (' + ing.id + ')', STYLES.dim)
  })
  
  console.log('%c\n🍽️ 菜品 (' + Object.keys(dishes).length + '个):', STYLES.info)
  Object.values(dishes).forEach(dish => {
    console.log('%c  ' + dish.icon + ' ' + dish.name + ' (' + dish.id + ') - ' + dish.appliance, STYLES.dim)
  })
}

/**
 * 显示帮助信息
 */
export function showHelp() {
  console.log('\n')
  console.log('%c🧪 菜谱测试工具 - 帮助', STYLES.title)
  console.log('%c' + '='.repeat(50), STYLES.dim)
  console.log('%c可用命令:', STYLES.info)
  console.log('%c  testRecipe("dish_id")     - 测试单个菜品配方', STYLES.dim)
  console.log('%c  testAllRecipes()          - 测试所有菜品配方', STYLES.dim)
  console.log('%c  traceIngredient("id")     - 追溯食材来源链', STYLES.dim)
  console.log('%c  validateRecipe({...})     - 验证新配方', STYLES.dim)
  console.log('%c  listIngredients()         - 列出所有可用材料', STYLES.dim)
  console.log('%c  recipeHelp()              - 显示此帮助', STYLES.dim)
  console.log('%c' + '='.repeat(50), STYLES.dim)
  console.log('%c示例:', STYLES.info)
  console.log('%c  testRecipe("tomato_egg")', STYLES.dim)
  console.log('%c  traceIngredient("tomato_fried")', STYLES.dim)
  console.log('%c  validateRecipe({', STYLES.dim)
  console.log('%c    name: "测试菜",', STYLES.dim)
  console.log('%c    appliance: "wok",', STYLES.dim)
  console.log('%c    recipe: [{ type: "prepared", id: "egg_fried", count: 1 }]', STYLES.dim)
  console.log('%c  })', STYLES.dim)
}

/**
 * 注册到全局
 */
export function registerGlobalTools() {
  window.testRecipe = testRecipe
  window.testAllRecipes = testAllRecipes
  window.traceIngredient = traceIngredient
  window.validateRecipe = validateRecipe
  window.listIngredients = listIngredients
  window.recipeHelp = showHelp
  
  console.log('%c🧪 菜谱测试工具已加载！输入 recipeHelp() 查看帮助', STYLES.success)
}

export default {
  testRecipe,
  testAllRecipes,
  traceIngredient,
  validateRecipe,
  listIngredients,
  showHelp,
  registerGlobalTools
}
