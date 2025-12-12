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

/**
 * 拖拽预览尺寸
 */
export const DRAG_PREVIEW = {
  DEFAULT_SIZE: 80,   // 默认预览尺寸
  PLATE_SIZE: 100,    // 盘子预览尺寸
  ICON_SIZE: 40,      // 图标尺寸
  PLATE_ICON_SIZE: 50 // 盘子图标尺寸
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
 * 拖放物品类型
 */
export const DRAG_TYPE = {
  INGREDIENT: 'ingredient',   // 生食材
  PREPARED: 'prepared',       // 备菜
  SEASONING: 'seasoning',     // 调料
  DISH: 'dish',               // 成品菜
  APPLIANCE: 'appliance',     // 厨具
  PLATE: 'plate'              // 盘子
}

/**
 * 拖放来源
 */
export const DRAG_SOURCE = {
  INVENTORY: 'inventory',       // 库存
  PREPARED_LIST: 'prepared_list', // 备菜区
  APPLIANCE: 'appliance',       // 厨具
  PLATE: 'plate'                // 盘子
}

/**
 * 顾客状态
 */
export const CUSTOMER_STATUS = {
  WAITING: 'waiting',   // 等待
  EATING: 'eating',     // 用餐中
  LEAVING: 'leaving'    // 离开中
}

// ========== 时间常量 ==========

/**
 * 动画时长（毫秒）
 */
export const ANIMATION = {
  TOAST_DURATION: 2500,       // Toast 显示时长
  WASH_DURATION: 2000,        // 盘子清洗时长
  BUG_ANIMATION: 800,         // 虫子动画时长
  PROCESS_CHECK_INTERVAL: 100 // 厨具进度检查间隔
}

/**
 * 默认处理时间（毫秒）
 */
export const DEFAULT_TIMES = {
  COOKING: 3000,        // 默认烹饪时间
  CLEANING: 3000,       // 默认清理时间
  REPAIRING: 5000       // 默认修理时间
}

// ========== 数值限制 ==========

/**
 * 容量限制
 */
export const LIMITS = {
  MAX_CUSTOMERS: 6,           // 最大顾客数
  MAX_SELECTED_INGREDIENTS: 3, // 最多选择食材数
  MAX_STACK_DEFAULT: 1,       // 默认堆叠数
  MAX_PREPARED_DISPLAY: 10    // 备菜区最大显示数
}

// ========== 快捷导出 ==========

// 兼容旧代码
export const GRID_COLS = GRID.COLS
export const GRID_ROWS = GRID.ROWS
