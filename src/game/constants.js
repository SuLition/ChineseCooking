/**
 * 游戏常量定义
 * Game Constants
 * 
 * 集中管理所有硬编码常量
 */

// ========== UI 布局常量 ==========

/**
 * 厨具网格布局
 */
export const GRID = {
  COLS: 10,           // 网格列数
  ROWS: 5,            // 网格行数
  CELL_SIZE: 70,      // 单元格尺寸（像素）
  GAP: 6              // 单元格间距（像素）
}

// ========== 游戏逻辑常量 ==========

/**
 * 厨具状态
 */
export const APPLIANCE_STATUS = {
  IDLE: 'idle',                     // 空闲
  HAS_INGREDIENTS: 'hasIngredients', // 有食材
  PROCESSING: 'processing',          // 处理中
  DONE: 'done',                      // 完成
  BURNED: 'burned',                  // 烧焦
  CLEANING: 'cleaning',              // 清理中
  BROKEN: 'broken',                  // 损坏
  REPAIRING: 'repairing'             // 修理中
}

/**
 * 盘子状态
 */
export const PLATE_STATUS = {
  EMPTY: 'empty',       // 空盘
  HAS_DISH: 'hasDish',  // 有菜
  DIRTY: 'dirty',       // 脏盘
  WASHING: 'washing'    // 清洗中
}

/**
 * 顾客状态
 */
export const CUSTOMER_STATUS = {
  WAITING: 'waiting',   // 等待
  EATING: 'eating',     // 用餐中
  LEAVING: 'leaving'    // 离开中
}
