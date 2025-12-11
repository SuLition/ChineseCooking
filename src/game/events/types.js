/**
 * 事件类型定义
 * Event Types Definition
 * 
 * 统一管理所有事件类型常量
 */

// ========== 事件分类 ==========
export const EventCategory = {
  INTERNAL: 'internal',     // 内部事件（做菜过程中）
  EXTERNAL: 'external'      // 外部事件（随时触发）
}

// ========== 外部事件交互类型 ==========
export const ExternalEventMode = {
  INTERACTIVE: 'interactive',  // 有交互（需要弹窗选择）
  PASSIVE: 'passive'           // 无交互（自动发生）
}

// ========== 内部事件类型 ==========
export const InternalEventTypes = {
  // 通用事件
  APPLIANCE_BREAK: 'appliance_break',   // 厨具损坏
  INGREDIENT_DROP: 'ingredient_drop',   // 食材掉落
  
  // 厨具专属事件
  WOK_FLIPPED: 'wok_flipped',           // 炒锅：锅翻了
  WOK_SPATULA_BROKEN: 'wok_spatula_broken', // 炒锅：锅铲坏了
  STEAMER_EXPLODED: 'steamer_exploded', // 蒸箱：爆炸了
  MIXER_CRAZY: 'mixer_crazy',           // 搅拌器：抽风了
  GRILL_SELF_BURN: 'grill_self_burn',   // 烤炉：自焚了
  
  // 盘子事件
  PLATE_SPILL: 'plate_spill',           // 菜撒了
  PLATE_BREAK: 'plate_break',           // 盘子碎了
  
  // 调料事件
  SEASONING_SPILL: 'seasoning_spill'    // 调料撒了
}

// ========== 外部事件类型 ==========
export const ExternalEventTypes = {
  // 有交互事件
  THIEF: 'thief',                       // 小偷
  BEGGAR: 'beggar',                     // 乞丐
  HEALTH_INSPECTOR: 'health_inspector', // 卫生检查员
  FOOD_CRITIC: 'food_critic',           // 美食评论家
  CELEBRITY: 'celebrity',               // 名人来访
  SUPPLIER: 'supplier',                 // 供应商推销
  
  // 无交互事件
  INGREDIENT_BUG: 'ingredient_bug',     // 虫子吃食材
  RAT_VISIT: 'rat_visit',               // 老鼠来访
  POWER_OUTAGE: 'power_outage'          // 短暂停电
}

export default {
  EventCategory,
  ExternalEventMode,
  InternalEventTypes,
  ExternalEventTypes
}
