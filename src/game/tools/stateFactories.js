/**
 * 状态工厂函数
 * State Factory Functions
 * 
 * 提供统一的状态对象创建方法
 */

import { APPLIANCE_STATUS, PLATE_STATUS } from '../constants'

/**
 * 创建厨具状态对象
 * @param {Object} options - 可选配置
 * @param {string} options.status - 初始状态 'idle' | 'hasIngredients' | 'processing' | 'done' | 'burned' | 'cleaning' | 'broken' | 'repairing'
 * @param {Array} options.ingredients - 初始食材列表
 * @param {Object} options.outputDish - 产出的成品菜
 * @param {number} options.progress - 处理进度 0-100
 * @param {number} options.trashCount - 垃圾数量（垃圾桶专用）
 * @returns {Object} 厨具状态对象
 */
export function createApplianceState(options = {}) {
  return {
    status: options.status || APPLIANCE_STATUS.IDLE,
    ingredients: options.ingredients || [],
    outputDish: options.outputDish || null,
    progress: options.progress || 0,
    burnProgress: options.burnProgress || 0,
    burnTimer: options.burnTimer || 0,
    startTime: options.startTime || 0,
    processTime: options.processTime || 0,
    // 垃圾桶专用
    trashCount: options.trashCount || 0
  }
}

/**
 * 创建空闲厨具状态
 */
export function createIdleApplianceState() {
  return createApplianceState({ status: APPLIANCE_STATUS.IDLE })
}

/**
 * 创建有食材厨具状态
 * @param {Array} ingredients - 食材列表
 */
export function createHasIngredientsState(ingredients = []) {
  return createApplianceState({
    status: APPLIANCE_STATUS.HAS_INGREDIENTS,
    ingredients
  })
}

/**
 * 创建处理中厨具状态
 * @param {Object} options
 * @param {Array} options.ingredients - 食材列表
 * @param {number} options.processTime - 处理时间（毫秒）
 * @param {Object} options.outputDish - 目标产出
 */
export function createProcessingState(options = {}) {
  return createApplianceState({
    status: APPLIANCE_STATUS.PROCESSING,
    ingredients: options.ingredients || [],
    outputDish: options.outputDish || null,
    progress: 0,
    startTime: Date.now(),
    processTime: options.processTime || 3000
  })
}

/**
 * 创建完成状态
 * @param {Object} outputDish - 产出的成品菜
 */
export function createDoneState(outputDish) {
  return createApplianceState({
    status: APPLIANCE_STATUS.DONE,
    outputDish,
    progress: 100,
    burnTimer: Date.now()
  })
}

/**
 * 创建盘子状态对象
 * @param {Object} options - 可选配置
 * @param {string} options.status - 'empty' | 'hasDish' | 'dirty' | 'washing'
 * @param {Object} options.dish - 盘中的菜品
 * @returns {Object} 盘子状态对象
 */
export function createPlateState(options = {}) {
  return {
    status: options.status || PLATE_STATUS.EMPTY,
    dish: options.dish || null,
    washProgress: options.washProgress || 0,
    washStartTime: options.washStartTime || 0,
    washDuration: options.washDuration || 2000
  }
}

/**
 * 创建空盘状态
 */
export function createEmptyPlateState() {
  return createPlateState({ status: PLATE_STATUS.EMPTY })
}

/**
 * 创建有菜盘状态
 * @param {Object} dish - 菜品对象
 */
export function createHasDishPlateState(dish) {
  return createPlateState({
    status: PLATE_STATUS.HAS_DISH,
    dish
  })
}

/**
 * 创建脏盘状态
 */
export function createDirtyPlateState() {
  return createPlateState({ status: PLATE_STATUS.DIRTY })
}

/**
 * 创建清洗中盘状态
 */
export function createWashingPlateState(duration = 2000) {
  return createPlateState({
    status: PLATE_STATUS.WASHING,
    washProgress: 0,
    washStartTime: Date.now(),
    washDuration: duration
  })
}
