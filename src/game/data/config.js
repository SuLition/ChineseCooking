/**
 * 游戏配置数据
 * Game Config Data
 */

// 时间段配置
export const timePeriods = {
  breakfast: {
    id: 'breakfast',
    name: '早餐时段',
    icon: '🌅',
    startHour: 7,
    endHour: 9,
    spawnChance: 0.10  // 原0.20
  },
  morning: {
    id: 'morning',
    name: '上午时段',
    icon: '⏰',
    startHour: 9,
    endHour: 11,
    spawnChance: 0.04  // 原0.08
  },
  lunch: {
    id: 'lunch',
    name: '午餐高峰',
    icon: '☀️',
    startHour: 11,
    endHour: 13,
    spawnChance: 0.175  // 原0.35
  },
  afternoon: {
    id: 'afternoon',
    name: '下午茶',
    icon: '🍵',
    startHour: 14,
    endHour: 16,
    spawnChance: 0.05  // 原0.10
  },
  preDinner: {
    id: 'preDinner',
    name: '傍晚时段',
    icon: '⏰',
    startHour: 16,
    endHour: 17,
    spawnChance: 0.04  // 原0.08
  },
  dinner: {
    id: 'dinner',
    name: '晚餐高峰',
    icon: '🌆',
    startHour: 17,
    endHour: 20,
    spawnChance: 0.175  // 原0.35
  },
  lateNight: {
    id: 'lateNight',
    name: '宵夜时段',
    icon: '🌙',
    startHour: 21,
    endHour: 22,
    spawnChance: 0.10  // 原0.20
  }
}

// 游戏常量配置
export const gameConfig = {
  // 营业时间
  openHour: 7,
  closeHour: 22,
  
  // 时间流速（每秒增加的游戏分钟数）
  timeSpeed: 2,
  
  // 顾客系统
  maxCustomers: 6,  // 最多同时存在6个顾客
  basePatience: 80,
  patiencePerPrice: 25,
  patiencePerStep: 50,
  patiencePerDifficulty: 15,
  
  // 游戏循环间隔（毫秒）
  gameLoopInterval: 100,
  customerSpawnInterval: 20000,  // 20秒检查一次是否生成顾客
  
  // 升级系统
  upgrades: {
    speed: {
      name: '烹饪速度',
      icon: '⚡',
      maxLevel: 5,
      costs: [100, 200, 400, 800, 1600],
      effect: 0.20 // 每级提升20%
    },
    tips: {
      name: '服务态度',
      icon: '💝',
      maxLevel: 5,
      costs: [150, 300, 600, 1200, 2400],
      effect: 0.15 // 每级提升15%小费
    },
    stations: {
      name: '烹饪台',
      icon: '🍳',
      maxLevel: 4,
      costs: [300, 600, 1200, 2400],
      effect: 1 // 每级增加1个烹饪台
    }
  },
  
  // 每日目标
  dailyGoals: {
    baseCustomers: 10,
    baseMoney: 200,
    levelMultiplier: 1.2
  }
}

// 获取当前时间段
export function getCurrentTimePeriod(hour) {
  for (const period of Object.values(timePeriods)) {
    if (hour >= period.startHour && hour < period.endHour) {
      return period
    }
  }
  return { id: 'closed', name: '休息时段', icon: '💤', spawnChance: 0 }
}

// 获取时间段的顾客生成概率
export function getSpawnChanceByHour(hour) {
  const period = getCurrentTimePeriod(hour)
  return period.spawnChance
}

export default gameConfig
